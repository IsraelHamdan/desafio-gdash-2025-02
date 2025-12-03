/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  WeatherLog,
  WeatherLogDocument,
} from '$/schemas/weather/weatherLog.schema';
import { Model, MongooseError } from 'mongoose';
import { Location, LocationDocument } from '$/schemas/weather/locations.schema';
import { LocationDTO } from '$/DTO/weather/location.dto';
import {
  WeatherLogDto,
  WeatherRequestResponseDto,
} from '$/DTO/weather/weather.dto';
import { WeatherIntakeDto } from '$/DTO/weather/weatherIntake.dto';

@Injectable()
export class WeatherService {
  private readonly locationsQueue: string = 'weather.locations';

  constructor(
    private readonly rabbit: RabbitmqService,
    @InjectModel(WeatherLog.name)
    private readonly weatherLog: Model<WeatherLogDocument>,
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
  ) {}

  // O cliente chama esse método! React -> Nest -> RabbitMQ -> Python
  async requestWeather(dto: LocationDTO): Promise<WeatherRequestResponseDto> {
    try {
      const cached = await this.findLocation(dto);

      if (cached) {
        return {
          status: 'cached',
          log: cached.log,
        };
      }

      await this.rabbit.sendToQueue(this.locationsQueue, { location: dto });

      const maxWaitMs = 15000;
      const pollIntervalMs = 1000;
      const start = Date.now();

      while (Date.now() - start < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

        const updated = await this.findLocation(dto);

        if (updated) {
          return {
            status: 'cached',
            log: updated.log,
          };
        }
      }

      return { status: 'queued' };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        throw new ServiceUnavailableException(err.message);
      }
      throw new InternalServerErrorException(err);
    }
  }
  async findLocation(
    data: LocationDTO,
  ): Promise<{ status: 'cached'; log: WeatherLogDto } | null> {
    try {
      const { countryCode, city, state } = data;

      const location = await this.locationModel.findOne({
        countryCode,
        city,
        state,
      });

      if (location) {
        const lastLog = await this.weatherLog
          .findOne({ location: location._id })
          .sort({ requestedAt: -1 })
          .exec();

        if (!lastLog) return null;

        const diffMs = Date.now() - new Date(lastLog.requestedAt).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 2) {
          const log: WeatherLogDto = {
            provider: lastLog.provider,
            requestedAt: lastLog.requestedAt,
            current: {
              temperature: lastLog.current.temperature,
              apparentTemperature: lastLog.current.apparentTemperature,
              humidity: lastLog.current.humidity,
              windspeed: lastLog.current.windspeed,
              precipitation: lastLog.current.precipitation,
              time: lastLog.current.time,
              isDay: lastLog.current.isDay,
            },
            hourly: lastLog.hourly.map((h) => ({
              time: h.time,
              temperature: h.temperature,
              humidity: h.humidity,
              windspeed: h.windspeed,
              precipitation: h.precipitation,
            })),
          };
          return { status: 'cached', log };
        }
      }
      return null;
    } catch (err) {
      if (err instanceof MongooseError) {
        throw new MongooseError(err.message);
      }

      throw new InternalServerErrorException(err);
    }
  }
    private async updateLocationDoc(
    dto: WeatherIntakeDto,
  ): Promise<LocationDocument | null> {
    try {
      const { countryCode, city, lat, lon, state } = dto.location;

      return await this.locationModel.findOneAndUpdate(
        { countryCode, city, state },
        { countryCode, city, state, lat, lon },
        { upsert: true, new: true },
      );
    } catch (err) {
      if (err instanceof MongooseError) {
        throw new MongooseError(err.message);
      }

      throw new InternalServerErrorException(err);
    }
  }


    async handleIntake(dto: WeatherIntakeDto): Promise<WeatherLogDto> {
    try {
      const updatedLocation = await this.updateLocationDoc(dto);

      if (!updatedLocation?._id)
        throw new Error('Falha ao atualizar/criar Location');

      const weatherLog = await this.weatherLog.create({
        location: updatedLocation?._id,
        provider: dto.provider,
        requestedAt: new Date(dto.requestedAt),
        current: {
          ...dto.current,
          time: dto.current.time,
        },
        hourly: dto.hourly.map((h) => ({ ...h, time: new Date(h.time) })),
      });
      return this.mapWeatherLogToDto(weatherLog);
    } catch (err) {
      if (err instanceof MongooseError) {
        throw new MongooseError(err.message);
      }
      if (err instanceof NotFoundException)
        throw new NotFoundException(err.message);

      throw new InternalServerErrorException(err);
    }
  }



  private mapWeatherLogToDto(doc: WeatherLogDocument): WeatherLogDto {
    return {
      provider: doc.provider,
      requestedAt: doc.requestedAt,
      current: {
        temperature: doc.current.temperature,
        apparentTemperature: doc.current.apparentTemperature,
        humidity: doc.current.humidity,
        windspeed: doc.current.windspeed,
        precipitation: doc.current.precipitation,
        time: doc.current.time,
        isDay: doc.current.isDay,
      },
      hourly: doc.hourly.map((h) => ({
        time: h.time,
        temperature: h.temperature,
        humidity: h.humidity,
        windspeed: h.windspeed,
        precipitation: h.precipitation,
      })),
    };
  }
}
