import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole";
import Login from "@/components/login";
import Register from "@/components/register";
import Tipography from "@/components/Tipography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export default function AuthPage() {
  return(
    <div className="relative min-h-screen w-full overflow-hidden">  
      {/* Background ocupa TUDO */}
      <HoleBackground className="fixed inset-0 w-full h-full"/>

      {/* Container do form centralizado */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-6 w-full grid grid-cols-2 font-display">
              <TabsTrigger value="login" className="">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Tipography variant="h1" className="mb-4">
                Seja bem-vindo(a)
              </Tipography>
              <Login />
            </TabsContent>

            <TabsContent value="register">
              <Tipography variant="h1" className="mb-4">
                Prazer em te conhecer
              </Tipography>
              <Register />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}