import type { WeatherInsightDto } from "@/lib/validations/insight";
import { Card, CardHeader } from "./ui/card";
import Tipography from "./Tipography";

type Insight = {
  data: WeatherInsightDto;
};

export default function InsightsComponent({ data }: Insight) {
  const date = data.date.toISOString();
  return (
    <Card>
      <CardHeader>
        <Tipography variant="p">
          {date}
        </Tipography>
      </CardHeader>
    </Card>
  );
}