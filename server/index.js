import express from "express";
import cors from "cors";
import lyricsFinder from "lyrics-finder";
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//TCP(通信プロトコルの種類)、安全性重視の通信方法だが転送速度は低い。
const PORT = 3001;

/**
 * POST通信(機密情報など含むため)
 */

//ログイン:
app.post("/login", async (req, res) => {
	const { code } = req.body;
	//Spotify Developers サイトから情報取得
	const spotifyApi = new SpotifyWebApi({
		redirectUri: process.env.REDIRECT_URI,
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
	});

	try {
		//code を引数として spotifyApi.authorizationCodeGrant(code) 関数を呼び出すと、フロントエンドで使用できる access_token 、 refresh_token 、 expires_in 値が取得できる
		const {
			body: { access_token, refresh_token, expires_in },
		} = await spotifyApi.authorizationCodeGrant(code);

		res.json({ access_token, refresh_token, expires_in });
	} catch (err) {
		console.log(err);
		res.sendStatus(400);
	}
});

app.post("/refresh", async (req, res) => {
	const { refreshToken } = req.body;
	const spotifyApi = new SpotifyWebApi({
		redirectUri: process.env.REDIRECT_URI,
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		refreshToken,
	});

	try {
		const {
			body: { access_token, expires_in },
		} = await spotifyApi.refreshAccessToken();
		res.json({ access_token, expires_in });
	} catch (err) {
		console.log(err);
		res.sendStatus(400);
	}
});

//GET通信(サーバーから情報を取ってくるだけだから)
app.get("/lyrics", async (req, res) => {
	const { artist, track } = req.query;
	const lyrics = (await lyricsFinder(artist, track)) || "No Lyrics Found";
	res.json({ lyrics });
});

app.listen(PORT, (err) => {
	if (err) console.log(err);
	console.log("listening on port...", PORT);
});
