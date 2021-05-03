import React, { useEffect, useRef, useState } from "react"
import './App.css';
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"

const socket = io('http://localhost:5000')

function App() {
	const [ me, setMe ] = useState<any>("")
	const [ stream, setStream ] = useState<any>()
	const [ receivingCall, setReceivingCall ] = useState<any>(false)
	const [ caller, setCaller ] = useState<any>("")
	const [ callerSignal, setCallerSignal ] = useState<any>()
	const [ callAccepted, setCallAccepted ] = useState<any>(false)
	const [ idToCall, setIdToCall ] = useState<any>("")
	const [ callEnded, setCallEnded] = useState<any>(false)
	const [ name, setName ] = useState<any>("")
	const myVideo = useRef<any>()
	const userVideo = useRef<any>()
	const connectionRef= useRef<any>()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
			console.log(1)
			setStream(stream)
			myVideo.current.srcObject = stream
		})
		socket.on("me", (id) => {
			console.log(2)
			setMe(id)
		})
		socket.on("callUser", (data) => {
			console.log(3)
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id : any) => {
		console.log(4)
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data : any) => {
			console.log(5)
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			console.log(6)
			userVideo.current.srcObject = stream
		})
		socket.on("callAccepted", (signal : any) => {
			console.log(7)
			setCallAccepted(true)
			peer.signal(signal)
		})
    	connectionRef.current = peer
	}

	const answerCall =() =>  {
		console.log(8)
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			console.log(9)
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			console.log(10)
			userVideo.current.srcObject = stream
		})
		console.log(11)
		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		console.log(12)
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>
		<h1>SOOR</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
					null}
				</div>
			</div>
			<div className="myId">
				<TextField
					id="filled-basic-2"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={me}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>
				<TextField
          			style={{ marginTop: "2rem" }}
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App