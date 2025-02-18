def view_logs():
    try:
        with open('logs/error.log', 'r') as log_file:
            logs = log_file.readlines()
            print("\n--- Error Logs ---\n")
            for line in logs[-50:]:  # Show the last 50 lines
                print(line.strip())
    except FileNotFoundError:
        print("Error log file not found.")

if __name__ == '__main__':
    view_logs()
