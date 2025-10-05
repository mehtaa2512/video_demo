import VideoJSPlayer from './components/VideoJSPlayer'

const LOCAL_4K = '/videos/nature.mp4'

export default function App() {
	const src = LOCAL_4K

	return (
		<div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
			<h1>Engage360</h1>
			<VideoJSPlayer src={src} poster="/vite.svg" />
		</div>
	)
}


