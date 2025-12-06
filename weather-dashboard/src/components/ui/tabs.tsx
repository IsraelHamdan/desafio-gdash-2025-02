import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "h-14 p-1 rounded-md bg-zinc-100",
        "mx-auto", // <-- ADICIONE ISSO para centralizar horizontalmente
        className
      )}
      {...props}
    />
  );
}
TabsList.displayName = TabsPrimitive.List.displayName

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // base (não cresce, não encolhe, dimensão do Figma)
        "flex items-center justify-center flex-grow-0 flex-shrink-0 px-3 py-1.5 rounded-sm text-sm font-medium h-12 whitespace-nowrap transition-colors",
        // estado inativo = texto cinza, sem bg (transparente para mostrar o container)
        "bg-transparent text-zinc-500",
        // estado ativo = fundo escuro, texto branco, negrito, sombra igual ao Figma
        "data-[state=active]:bg-[#101828] data-[state=active]:text-white data-[state=active]:font-bold",
        "data-[state=active]:shadow-[0px_1px_2px_0_rgba(0,0,0,0.05)] data-[state=active]:rounded",
        // foco/a11y
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500",
        className
      )}
      {...props}
    />
  );
}
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        // Adiciona os estilos de cartão aqui!
        "bg-white rounded-lg shadow p-6",
        
        // Assegura que o conteúdo inativo não é exibido
        // O Radix geralmente faz isso, mas é bom garantir:
        "data-[state=inactive]:hidden", 
        
        "flex-1 outline-none", 
        className
      )}
      {...props}
    />
  );
}
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
