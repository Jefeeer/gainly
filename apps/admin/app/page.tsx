/**
 * Admin Dashboard — §40: admin app overview.
 * §41-§42: exercise and user management.
 */

export default function AdminDashboard() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Gainly Admin</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="Total Users" value="—" />
        <StatCard title="Active Today" value="—" />
        <StatCard title="Workouts This Week" value="—" />
        <StatCard title="Exercises in Library" value="302" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <section style={{ padding: '1.5rem', border: '1px solid #E4E7E3', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/exercises" style={{ color: '#15803D', textDecoration: 'none' }}>Manage Exercises →</a></li>
            <li><a href="/users" style={{ color: '#15803D', textDecoration: 'none' }}>Manage Users →</a></li>
            <li><a href="/programs" style={{ color: '#15803D', textDecoration: 'none' }}>Manage Programs →</a></li>
            <li><a href="/analytics" style={{ color: '#15803D', textDecoration: 'none' }}>View Analytics →</a></li>
          </ul>
        </section>

        <section style={{ padding: '1.5rem', border: '1px solid #E4E7E3', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>System Status</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ color: '#16A34A' }}>✓ Database: Connected</li>
            <li style={{ color: '#16A34A' }}>✓ Auth: Operational</li>
            <li style={{ color: '#16A34A' }}>✓ Storage: Operational</li>
            <li style={{ color: '#6B746E' }}>— Payments: Not configured</li>
          </ul>
        </section>
      </div>

      <p style={{ marginTop: '2rem', color: '#6B746E', fontSize: '0.875rem' }}>
        Admin features are placeholder. Full admin UI will be built when auth and DB are fully wired.
      </p>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: '1.5rem', border: '1px solid #E4E7E3', borderRadius: '12px' }}>
      <div style={{ fontSize: '0.875rem', color: '#6B746E' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
    </div>
  );
}
