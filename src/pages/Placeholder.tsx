export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <section className="max-w-[720px] mx-auto px-6 py-32">
      <div className="h-eyebrow mb-4">未上线</div>
      <h1 className="h-display text-5xl text-ink-100 mb-6">{title}</h1>
      <p className="text-ink-300 leading-relaxed">{note}</p>
    </section>
  );
}
