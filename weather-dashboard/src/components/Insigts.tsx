import { AIResponseSchema, type AIResponse } from "@/lib/validations/insight";
import { Card, CardContent, CardHeader } from "./ui/card";
import Tipography from "./Tipography";
import type { WeatherIntakeDto } from "@/lib/validations/weather";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

type InsightsComponentProps = {
  data: WeatherIntakeDto;
};
export default function InsightsComponent({ data }: InsightsComponentProps) {

  const [insight, setInsight] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchInsight = async () => {
    try {
      setLoading(true);

      const res = await api.post("/weather/insight", data);

      // valida com Zod
      const parsed = AIResponseSchema.parse(res.data);

      setInsight(parsed);
    } catch (err) {
      console.error("Erro ao gerar insight:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, []);


  return (
    <Card className="mt-6">
      <CardHeader>
        <Tipography variant="h2">Insights de Energia Solar</Tipography>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {loading && (
          <Tipography variant="p" className="text-muted-foreground">
            Gerando insights com IA...
          </Tipography>
        )}

        {!loading && insight && (
          <>
            <Tipography variant="p">
              <strong>Resumo:</strong> {insight.summary}
            </Tipography>

            <Tipography variant="p">
              <strong>Previsão de Produção:</strong> {insight.productionForecast}
            </Tipography>

            <Tipography variant="p">
              <strong>Recomendação ao Consumidor:</strong> {insight.consumerAdvice}
            </Tipography>

            <Tipography variant="p">
              <strong>Nota Técnica:</strong> {insight.technicalNote}
            </Tipography>

            {insight.tags && insight.tags.length > 0 && (
              <Tipography variant="p">
                <strong>Tags:</strong> {insight.tags.join(", ")}
              </Tipography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}