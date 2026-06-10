// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import PageLayout from './components/layout/PageLayout'
import HomePage from './pages/HomePage'

// About
import Aimsandscope       from './pages/about/Aimsandscope'
import Editorialboard     from './pages/about/Editorialboard'
import Editorialpolicies  from './pages/about/Editorialpolicies'
import Ethics             from './pages/about/Ethics'
import Indexing           from './pages/about/Indexing'
import Journalinformation from './pages/about/Journalinformation'

// Articles
import Currentissue    from './pages/articles/Currentissue'
import Issueinprogress from './pages/articles/Issueinprogress'
import Archive         from './pages/articles/Archive'
import IssueDetail     from './pages/articles/IssueDetail'

// Authors
import Instructions      from './pages/author/Instructions'
import Charges           from './pages/author/Charges'
import SubmitManuscript  from './pages/author/SubmitManuscript'
import TrackManuscript   from './pages/author/TrackManuscript'
import GetCertificate    from './pages/author/GetCertificate'
import MySubmissions     from './pages/author/MySubmissions'

// Updates
import CallForPapers    from './pages/updates/CallForPapers'
import NewsAndHighlights from './pages/updates/NewsAndHighlights'
import Testimonials     from './pages/updates/Testimonials'

// Join & Contact
import JoinPage     from './pages/join/JoinPage'
import ContactPage  from './pages/ContactPage'

// Reviewer
import PendingReviews from './pages/reviewer/PendingReviews'

// Admin
import AdminLogin        from './pages/admin/AdminLogin'
import AdminLayout       from './pages/admin/AdminLayout'
import Dashboard         from './pages/admin/Dashboard'
import ManuscriptsReview from './pages/admin/ManuscriptsReview'
import UsersManagement   from './pages/admin/UsersManagement'
import IssuesManagement  from './pages/admin/IssuesManagement'
import ApplicationsPage  from './pages/admin/ApplicationsPage'
import MessagesPage      from './pages/admin/MessagesPage'
import Settings          from './pages/admin/Settings'

// ── Route guards ──────────────────────────────────────────────────────────────

/** Redirect to login if not authenticated as editor/admin/reviewer */
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, isReviewer, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated || !isReviewer) return <Navigate to="/admin/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      {/* ── Public site ──────────────────────────────────────────────── */}
      <Route path="/" element={<PageLayout />}>
        <Route index element={<HomePage />} />

        {/* About */}
        <Route path="aims-and-scope"      element={<Aimsandscope />} />
        <Route path="editorial-board"     element={<Editorialboard />} />
        <Route path="editorial-policies"  element={<Editorialpolicies />} />
        <Route path="ethics"              element={<Ethics />} />
        <Route path="indexing"            element={<Indexing />} />
        <Route path="journal-information" element={<Journalinformation />} />

        {/* Articles */}
        <Route path="current-issue"   element={<Currentissue />} />
        <Route path="issue-in-progress" element={<Issueinprogress />} />
        <Route path="archive"         element={<Archive />} />
        <Route path="archive/issue/:volumeId/:issueId" element={<IssueDetail />} />

        {/* Authors */}
        <Route path="instructions"       element={<Instructions />} />
        <Route path="charges"            element={<Charges />} />
        <Route path="submit-manuscript"  element={<SubmitManuscript />} />
        <Route path="track-manuscript"   element={<TrackManuscript />} />
        <Route path="get-certificate"    element={<GetCertificate />} />
        <Route path="my-submissions"     element={<MySubmissions />} />

        {/* Updates */}
        <Route path="call-for-papers"  element={<CallForPapers />} />
        <Route path="news-highlights"  element={<NewsAndHighlights />} />
        <Route path="testimonials"     element={<Testimonials />} />

        {/* Join & Contact */}
        <Route path="join"    element={<JoinPage />} />
        <Route path="contact" element={<ContactPage />} />

        {/* Reviewer portal (public URL, but content gated inside component) */}
        <Route path="reviewer/pending-reviews" element={<PendingReviews />} />
      </Route>

      {/* ── Admin login (no layout) ───────────────────────────────────── */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ── Admin panel (protected, own layout) ──────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="manuscripts"  element={<ManuscriptsReview />} />
        <Route path="issues"       element={<IssuesManagement />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="messages"     element={<MessagesPage />} />
        <Route path="users"        element={<UsersManagement />} />
        <Route path="settings"     element={<Settings />} />
      </Route>

      {/* ── Fallback ─────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App