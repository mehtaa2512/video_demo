import {useEffect, useRef} from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export type VideoJSPlayerProps = {
	src: string
	poster?: string
	className?: string
	autoPlay?: boolean
	controls?: boolean
	fluid?: boolean
}

export default function VideoJSPlayer({src, poster, className, autoPlay = false, controls = true, fluid = true}: VideoJSPlayerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const playerRef = useRef<ReturnType<typeof videojs> | null>(null)
  const mimeType = src.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'

	useEffect(() => {
		if (!containerRef.current) return

		if (!playerRef.current) {
			const videoElement = document.createElement('video-js')
			videoElement.classList.add('video-js', 'vjs-big-play-centered')
			if (className) videoElement.classList.add(...className.split(' '))
			containerRef.current.appendChild(videoElement)

			const options: Parameters<typeof videojs>[1] = {
				autoplay: autoPlay,
				controls,
				fluid,
				poster,
				sources: [
					{src, type: mimeType},
				],
			}

			playerRef.current = videojs(videoElement, options)
		} else {
			const player = playerRef.current
			player.autoplay(autoPlay)
			player.controls(controls)
			player.poster(poster || '')
			player.fluid(fluid)
			player.src([{src, type: mimeType}])
		}
	}, [src, poster, className, autoPlay, controls, fluid])

	useEffect(() => {
		return () => {
			if (playerRef.current && !playerRef.current.isDisposed()) {
				playerRef.current.dispose()
				playerRef.current = null
			}
		}
	}, [])

	return (
		<div data-vjs-player>
			<div ref={containerRef} />
		</div>
	)
}
