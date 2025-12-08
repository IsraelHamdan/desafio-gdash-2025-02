import { useGeocodingQuery } from "@/hooks/useLocation";
import type { LocationDTO } from "@/lib/validations/location";
import { Activity, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import Tipography from "./Tipography";

export type LocationSearchCardProps = {
  onSelect: (location: LocationDTO) => void | Promise<unknown>;
};


export default function SearchComponent({ onSelect }: LocationSearchCardProps) {
  const [query, setQuery] = useState<string>("");

  const {
    data: locations = [],
    isLoading,

  } = useGeocodingQuery(query);

  return (
    <div className="relative">
      <Card className="p-4 flex items-center gap-2">
        <Tipography variant="h3" className="text-blue-400">BigWeather</Tipography>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome da cidade..."
        />
      </Card>
      <Activity mode={query.length >= 2 ? "visible" : "hidden"}>
        <Card
          className=" absolute left-0 right-0 top-full 
          mt-1 
          max-h-64 overflow-y-auto 
          border rounded-md shadow-lg
          z-50
        ">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Buscando cidades...
            </div>
          )}

          {!isLoading && locations.map((loc) => (
            <p
              key={loc.id}
              className="w-full text-left px-3 py-2 hover:bg-muted cursor-pointer"
              onClick={() =>
                onSelect({
                  city: loc.name,
                  state: loc.admin1 ?? "",
                  countryCode: loc.country_code
                })
              }
            >
              {loc.name} — {loc.admin1 ?? ""}, {loc.country} ({loc.country_code})
            </p>
          ))}
        </Card>
      </Activity>
    </div>

  );
}