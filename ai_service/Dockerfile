# Use the official slim Python image for a smaller footprint
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the dependencies file first to leverage Docker's build cache
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source code into the container
COPY . .

# Expose the port the Uvicorn server will run on
EXPOSE 8001

# Command to run the application
# Use --host 0.0.0.0 to make the service accessible from other containers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"] 