
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import { SettingsProvider } from "@/contexts/SettingsContext"
import { GoAuthProvider } from "@/contexts/GoAuthContext"
import { APIProvider } from "@/contexts/APIContext"
import AppContent from "@/components/AppContent"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <GoAuthProvider>
        <SettingsProvider>
          <APIProvider>
            <AppContent />
          </APIProvider>
        </SettingsProvider>
      </GoAuthProvider>
    </QueryClientProvider>
  )
}

export default App
