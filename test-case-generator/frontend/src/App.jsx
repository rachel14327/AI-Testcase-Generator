import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import LeftSidebar from './components/LeftSidebar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Protected from './pages/Protected'
import Upload from './pages/Upload'
import Rag from './pages/Rag'
import Features from './pages/Features'
import FeatureTestcases from './pages/FeatureTestcases'
import TestcaseDetail from './pages/TestcaseDetail'

function App() {
  return (
    <>
      <Header />
      <LeftSidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/protected" element={<Protected />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/rag" element={<Rag />} />
        <Route path="/features" element={<Features />} />
        <Route path="/features/:featureId" element={<FeatureTestcases />} />
        <Route path="/features/:featureId/testcases/:testcaseId" element={<TestcaseDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
