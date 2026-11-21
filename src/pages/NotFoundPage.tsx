import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';

export function NotFoundPage() {
  const { m } = useI18n();
  return (
    <div className="empty">
      <h1>{m.notFound.title}</h1>
      <p>{m.notFound.body}</p>
      <Link to="/" className="btn primary">
        {m.notFound.home}
      </Link>
    </div>
  );
}
