import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/ui/Layout';
import Home from '@/pages/Home';
import Atlas from '@/pages/Atlas';
import Instrument from '@/pages/Instrument';
import Scenes from '@/pages/Scenes';
import SceneDetail from '@/pages/SceneDetail';
import Sandbox from '@/pages/Sandbox';
import Lessons from '@/pages/Lessons';
import Lesson from '@/pages/Lesson';
import Glossary from '@/pages/Glossary';
import Placeholder from '@/pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="atlas" element={<Atlas />} />
        <Route path="atlas/:id" element={<Instrument />} />
        <Route path="scenes" element={<Scenes />} />
        <Route path="scenes/:slug" element={<SceneDetail />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="lessons/:id" element={<Lesson />} />
        <Route path="sandbox" element={<Sandbox />} />
        <Route path="glossary" element={<Glossary />} />
        <Route path="*" element={<Placeholder title="404" note="这条路径还没铺。" />} />
      </Route>
    </Routes>
  );
}
