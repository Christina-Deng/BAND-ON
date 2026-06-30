import { Link } from 'react-router-dom';

interface Props {
  title?: string;
  description?: string;
}

export function NoBandsEmptyState({
  title = '还没有加入乐队',
  description = '创建或加入乐队后即可使用本功能。',
}: Props) {
  return (
    <div className="empty-state-panel rounded-xl p-8 text-center">
      <p className="text-lg text-slate-300">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg border border-accent-600 bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500"
      >
        去首页创建 / 加入乐队
      </Link>
    </div>
  );
}
