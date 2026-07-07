interface Props {
  title: string;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, lead, actions }: Props) {
  return (
    <header className="page-header">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          {lead && <p className="page-lead mt-1">{lead}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
