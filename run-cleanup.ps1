# Create a .env file in the root directory with your DATABASE_URL
echo "DATABASE_URL=your_mongodb_connection_string_here" > .env

# Then run the cleanup script
npm run cleanup-production-ts