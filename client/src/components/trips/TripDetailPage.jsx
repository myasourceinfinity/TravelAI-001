// src/components/trips/TripDetailPage.jsx
import { useParams } from 'react-router-dom';

export default function TripDetailPage() {
  const { id } = useParams();
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Trip detail — {id}</h2>
      <p>Coming soon.</p>
    </div>
  );
}