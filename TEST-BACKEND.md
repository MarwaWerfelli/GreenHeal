# Test Backend Visualization API

## Local smoke test

Start the backend locally first:

```bash
cd backend
npm run dev
```

Then, in another terminal, run the visualization smoke test with a real room image:

```bash
cd backend
npm run smoke -- ../path/to/room.jpg --plant="Monstera" --placement="table corner"
```

The helper will:

1. call the existing `POST /api/visualize` endpoint
2. use the current **same-room single-plant** request shape
3. save the returned preview next to your source image as `*.greenheal-preview.jpg`

## Test against a deployed backend

```bash
cd backend
npm run smoke -- ../path/to/room.jpg --base-url=https://greenhealbackend.vercel.app --plant="Snake Plant" --placement="corner floor"
```

## Health check

- Local: `http://localhost:3000/health`
- Deployed: `https://greenhealbackend.vercel.app/health`

Expected response:

```json
{"status":"ok","message":"GreenHeal Backend API is running"}
```

## Requirements

- `STABILITY_API_KEY` must be set for the backend you are calling
- image should be a real room photo
- image size should stay under the backend upload limit (`10MB`)

## Current request shape

The smoke helper sends the same main fields used by the app:

- `image`
- `plantDescriptions`
- `selectedPlantName`
- `selectedPlacement`
- `placementMode`
- `renderStyle=same-room-single-plant`

The backend then decides whether to use:

- **masked inpaint** for selected single-plant previews
- **structure control** as the fallback path

## What to check in the result

1. the room layout stays the same
2. only the selected plant is added
3. the placement matches the chosen location
4. the saved preview looks modern and realistic
5. the console prints `Masked flow: yes`

## If it fails

- check backend logs for `[BACKEND]` messages
- verify `STABILITY_API_KEY` is present
- try a smaller/lighter room image
- try a clearer placement, such as `table corner`, `window sill`, or `wall hanging planter`
