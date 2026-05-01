import { useState } from 'react'
import HomeView from './views/HomeView'
import EntryView from './views/EntryView'
import type { AppView } from './types'

export default function App() {
  const [view, setView] = useState<AppView>({ screen: 'home' })

  if (view.screen === 'entry') {
    return (
      <EntryView
        entryId={view.entryId}
        onBack={() => setView({ screen: 'home' })}
      />
    )
  }

  return (
    <HomeView onOpenEntry={(id) => setView({ screen: 'entry', entryId: id })} />
  )
}
