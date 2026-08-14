import { createApp } from './app.ts'
import { config } from './config.ts'

const app = createApp()

app.listen(config.port, '0.0.0.0', () => {
  console.log(`thirdparty-req-server listening on http://0.0.0.0:${config.port}`);
});
