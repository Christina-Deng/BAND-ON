interface Props {
  title: string;
  lead?: string;
}

export function PageHeader({ title, lead }: Props) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      {lead && <p className="page-lead mt-1">{lead}</p>}
    </header>
  );
}
