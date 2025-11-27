/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
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
import { WeatherIntakeDto } from '$/DTO/weather/weatherIntake.dto';
import { WeatherRequestResponseDto } from '$/DTO/weather/weather.dto';

@Injectable()
export class WeatherService {
  private readonly locationsQueue: string = 'weather.location';

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
      const isRecentWeather = await this.findLocation(dto);

      if (isRecentWeather) {
        const payload = {
          city: dto.city,
          state: dto.state,
          neighborhood: dto.neighborhood,
        };
        await this.rabbit.sendToQueue(this.locationsQueue, payload);
        return { status: 'queued' };
      }
    } catch (err) {
      this.SendErrorMessage(err, 'WeatherService.requestWeather');
    }
  }

  async handleIntake(dto: WeatherIntakeDto) {
    try {
      const updatedLocation = await this.updateLocationDoc(dto);

      const weatherLog = await this.weatherLog.create({
        location: updatedLocation?._id,
        provider: dto.provider,
        requestedAt: new Date(dto.requestedAt),
        current: {
          ...dto.current,
          time: new Date(dto.current.time),
        },
        hourly: dto.hourly.map((h) => ({ ...h, time: new Date(h.time) })),
      });
    } catch (err) {
      this.SendErrorMessage(err, 'WeatherService.requestWeather');
    }
  }

  async findLocation(data: LocationDTO) {
    try {
      const { state, city, neighborhood } = data;

      const location = await this.locationModel.findOne({
        state,
        city,
        neighborhood,
      });

      if (location) {
        const lastLog = await this.weatherLog
          .findOne({ location: location._id })
          .sort({ requestedAt: -1 })
          .lean();

        if (lastLog) {
          const diffMs = Date.now() - new Date(lastLog.requestedAt).getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffHours < 2) {
            // Já tem dado recente, nem manda pro Python
            return { status: 'cached', log: lastLog };
          }
        }
      }
    } catch (err) {
      this.SendErrorMessage(err, 'findLocation');
    }
  }

  private async updateLocationDoc(
    dto: WeatherIntakeDto,
  ): Promise<LocationDocument | null> {
    try {
      const locationDocFilter = {
        state: dto.location.state,
        city: dto.location.city,
        neighborhood: dto.location.neighborhood,
      };
      return await this.locationModel.findByIdAndUpdate(
        locationDocFilter,
        {
          state: dto.location.state,
          city: dto.location.city,
          neighborhood: dto.location.neighborhood,
          lat: dto.location.lat,
          lon: dto.location.lon,
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      if (err instanceof MongooseError) throw new MongooseError(err.message);
      throw new InternalServerErrorException(err.message);
    }
  }

  private SendErrorMessage(err: unknown, ctx: string): never {
    if (err instanceof MongooseError) {
      throw new MongooseError(`Erro no DB em ${ctx}: ${err.message}`);
    }

    if (this.isRabbitMQError(err))
      throw new ServiceUnavailableException(
        `Erro de mensageria em ${ctx}: ${err.message}`,
      );

    if (err instanceof Error) {
      throw new InternalServerErrorException(
        `Erro interno em ${ctx}: ${err.message}`,
      );
    }

    throw new InternalServerErrorException(
      `Erro desconhecido em ${ctx}: ${err.message}`,
    );
  }

  private isRabbitMQError(err: unknown): err is Error & { code?: string } {
    return err instanceof Error && typeof (err as any).code === 'string';
  }
}
