const { exec } = require('child_process');

function disableAppArmor() {
  exec("gnome-terminal --maximize --title='First launch need root access' --zoom=2 -- sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}  

module.exports = disableAppArmor;