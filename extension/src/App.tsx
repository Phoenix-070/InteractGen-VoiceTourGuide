import TourOverlay from './components/TourOverlay';

function App() {
  return (
    <div className="App">
      <h1 style={{ textAlign: 'center', marginTop: '50px', color: '#333' }}>InteractGen Voice Tour (Dev Mode)</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>
        This is the standalone view. In the extension, the overlay below is injected.
      </p>

      {/* 
        In strict dev mode, we might want to mock the 'scanPage' or 
        let it try to scan this very page (which has little content).
      */}
      <TourOverlay />
    </div>
  );
}

export default App;
