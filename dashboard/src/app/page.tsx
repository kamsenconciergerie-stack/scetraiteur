import { redirect } from 'next/navigation';

// Racine → rediriger vers le dashboard admin
export default function Home() {
  redirect('/admin');
}
