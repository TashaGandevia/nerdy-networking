// App root — React Router setup with AppShell layout wrapping all pages

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell }  from '@/components/layout/AppShell'
import { Home }      from '@/pages/Home'
import { Campaign }  from '@/pages/Campaign'
import { Sandbox }   from '@/pages/Sandbox'
import { Flashcards } from '@/pages/Flashcards'
import { ExamPrep }  from '@/pages/ExamPrep'
import { Study }     from '@/pages/Study'
import { Level }     from '@/pages/Level'

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/"            element={<Home />}      />
          <Route path="/campaign"    element={<Campaign />}  />
          <Route path="/sandbox"     element={<Sandbox />}   />
          <Route path="/flashcards"  element={<Flashcards />} />
          <Route path="/exam-prep"   element={<ExamPrep />}  />
          <Route path="/study"       element={<Study />}     />
          <Route path="/level/:levelId" element={<Level />}  />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
