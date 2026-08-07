import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { SessionBoundary } from '@/app/SessionBoundary'
import { router } from '@/app/router'

function App() {
  return (
    <AppProviders>
      <SessionBoundary>
        <RouterProvider router={router} />
      </SessionBoundary>
    </AppProviders>
  )
}

export default App
