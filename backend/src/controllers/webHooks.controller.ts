import { asyncHandler } from "@utils/asyncHandler";
import crypto from 'crypto';
import { CreateWebHooks } from "@utils/CreateWebHooks";
import { Installation } from "@modules/Installation";
import {handlePushEvent} from "@webHooks/handlePushEvent";

import {runSonarQubeScanner,projectKey} from "@utils/SonarQube"


export const webHookHandler=asyncHandler(async(req,res,next)=>{
  
  

 const signature = req.headers['x-hub-signature-256'] as string;
const expected = 'sha256=' + crypto
  .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET as string)
  .update(req.body)
  .digest('hex');

if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
  return res.status(401).send('Invalid signature');
}

const event = req.headers['x-github-event'];
const payload = JSON.parse(req.body.toString());

if (event === 'installation') {
  const installationId = payload.installation.id;

  if (payload.action === 'created') {
    await CreateWebHooks(payload.installation.id,payload) // await this — don't fire-and-forget
  }
  else if (payload.action === 'deleted') {
    await Installation.updateOne(
      { installationId },
      { $set: { status: 'deleted', deletedAt: new Date() } }
    );
  }
  else if (payload.action === 'suspend') {
    await Installation.updateOne(
      { installationId },
      { $set: { status: 'suspended', suspendedAt: new Date() } }
    );
  }
  else if (payload.action === 'unsuspend') {
    await Installation.updateOne(
      { installationId },
      { $set: { status: 'confirmed', suspendedAt: null } }
    );
  }
  else {
    console.log('unhandled installation action:', payload.action);
  }
}
else if(event === 'push'){
 const response = await handlePushEvent(payload)
 await runSonarQubeScanner(response, projectKey(payload.installation.id, payload.repository.id));
}
console.log('Received event:', event, 'with payload:', payload);

res.send("hello");

})