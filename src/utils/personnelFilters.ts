export type PersonnelLike = {
  id?: string | number;
  role?: string;
  username?: string;
  email?: string;
  title?: string;
  name?: string;
  [key: string]: any;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isAdminAccount(person: PersonnelLike | null | undefined): boolean {
  if (!person) return false;

  const role = normalizeText(person.role);
  const username = normalizeText(person.username);
  const email = normalizeText(person.email);
  const title = normalizeText(person.title);

  return (
    role === 'admin' ||
    username === 'admin' ||
    username.includes('admin') ||
    email === 'admin' ||
    email.includes('admin') ||
    title.includes('quản trị') ||
    title.includes('admin') ||
    title.includes('giám đốc') ||
    title.includes('director')
  );
}

export function filterNonAdminPersonnel<T extends PersonnelLike>(list: T[]): T[] {
  return (list || []).filter((person) => !isAdminAccount(person));
}

export function formatPersonnelLabel(person: PersonnelLike): string {
  const name = person?.name || person?.username || 'Nhân viên';
  const title = person?.title || person?.role || 'Nhân viên';
  const normalizedTitle = title.toLowerCase() === 'manager' || title.toLowerCase() === 'quản lý'
    ? 'Quản lý'
    : title || 'Nhân viên';

  return `${name} (${normalizedTitle})`;
}
