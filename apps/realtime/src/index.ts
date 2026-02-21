import { server } from "./app";

const PORT = process.env.PORT || 4002;
server.listen(PORT, () => {
    console.log(`Realtime server running on port ${PORT}`);
});