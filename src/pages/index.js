export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Proyecto Blockchain</h1>
      <p>Selecciona una funcionalidad:</p>
      <ul>
        <li><a href="/todo">ToDoSimple (ejemplo anterior)</a></li>
        <li><a href="/subasta">Subasta descentralizada (entrega)</a></li>
      </ul>
    </div>
  );
}
