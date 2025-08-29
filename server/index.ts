server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Attempting to kill existing processes...`,
    );
    try {
      require("child_process").execSync(
        `pkill -f "tsx server/index.ts" && pkill -f "npm run dev"`,
        { stdio: "ignore" },
      );
      console.log("Killed existing processes. Please restart the server.");
    } catch (e) {
      console.error(
        "Could not kill existing processes. Please manually stop other server instances.",
      );
    }
    process.exit(1);
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});
