import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/ui/Layout';
import Home from '@/pages/Home';
import Atlas from '@/pages/Atlas';
import Instrument from '@/pages/Instrument';
import Scenes from '@/pages/Scenes';
import SceneDetail from '@/pages/SceneDetail';
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
        <Route path="lessons" element={<Placeholder title="入门五课" note="M4 上线：从'五轨是什么'到'你的第一段配乐'，10–15 分钟一节。" />} />
        <Route path="sandbox" element={<Placeholder title="配乐试听台" note="M5 上线：拖乐器到五轨上拼一段配乐，导出 webm。" />} />
        <Route path="glossary" element={<Placeholder title="术语手册" note="M4 上线：drone / stinger / leitmotif 等 40 条术语，每条配一段 3s 演示。" />} />
        <Route path="*" element={<Placeholder title="404" note="这条路径还没铺。" />} />
      </Route>
    </Routes>
  );
}
