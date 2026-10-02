import { Installation } from "@modules/Installation";
import { User } from "@modules/User";
import { asyncHandler } from "@utils/asyncHandler";
import { response, type Response } from "express";

const connectedClients = new Map<string, Response[]>();

const getEvents = asyncHandler(async (req, res) => {

    const userId = req.user?.userId?.toString();

    if (!userId) {
        res.status(401).end();
        return;
    }

    console.log("Client connected:", userId);

    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    });

    res.flushHeaders();

    // Create array for this user
    if (!connectedClients.has(userId)) {
        connectedClients.set(userId, []);
    }

    // Store this connection
    connectedClients.get(userId)!.push(res);

    // Tell browser how long to wait before reconnecting
    res.write("retry: 3000\n\n");

    // Heartbeat
    const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
    }, 15000);

    // Client disconnected
    req.on("close", () => {

        clearInterval(heartbeat);

        const clients = connectedClients.get(userId);

        if (!clients) {
            return;
        }

        // Remove this particular connection
        const index = clients.indexOf(res);

        if (index !== -1) {
            clients.splice(index, 1);
        }

        // Remove user if no connections remain
        if (clients.length === 0) {
            connectedClients.delete(userId);
        }

        console.log(
            "Client disconnected:",
            userId,
            "Remaining connections:",
            clients.length
        );
    });
    console.log("Connected clients:", connectedClients.size);
});

const sendEventToUser = async (
    userId: string | undefined,
    installationId: number | undefined,
    event: string,
    data: unknown
) => {
   
   console.log("inside send Event",userId,installationId,event,data)
    let userIdString: string | undefined = userId;

    if (installationId !== undefined) {

        const installation = await Installation.findOne({
            installationId
        });

        if (!installation) {
            return;
        }

        const user = await User.findOne({
            githubId: installation.accountId
        });

        if (!user) {
            return;
        }

        userIdString = user._id.toString();
    }

    if (!userIdString) {
        return;
    }

    const clients = connectedClients.get(userIdString);
     console.log("clients",clients)
    if (!clients) {
        return;
    }

    const message =
        `event: ${event}\n` +
        `data: ${JSON.stringify(data)}\n\n`;

    clients.forEach((res) => {
      console.log(message)
        res.write(message);
    });
    console.log(userIdString)
};

export { getEvents, sendEventToUser };