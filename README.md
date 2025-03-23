# Silver Spring Records Website

Welcome to the Silver Spring Records website project. This repository contains the codebase for the official Silver Spring Records site, showcasing services, projects, and media for the company.

## Project Structure

```
.
├── keys/               # SSH key folder (not included in the repository)
├── styles.css          # Stylesheet for the website
├── index.html          # Homepage HTML
├── services.html       # Services page HTML
├── about.html          # About page HTML
├── .gitignore          # Git ignore file
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites

- Ensure you have the following tools installed:
  - Git
  - A text editor (e.g., VS Code)

### Cloning the Repository

To clone this repository to your local machine:

```bash
git clone https://github.com/juanjose49/silverspringrecords.com.git
```

### SSH Access to the Server

To SSH into the server, use the following command:

```bash
ssh -i ./keys/private.key -p 21098 heynlgyh@silverspringrecords.com
```

- **`-i`**: Specifies the path to the private key.
- **`-p`**: Sets the port number for the SSH connection (default is `22`, but this project uses `21098`).

## Key Security

The `keys/` folder is ignored by Git (specified in `.gitignore`). Do not share or commit private keys to the repository.


## Deploy

When connected to the server run:

```
cd dist
git pull 
find ../public_html -mindepth 1 ! -name '.*' -exec rm -rf {} +
cp * ../public_html/  -r
```

### Troubleshooting SSH

- Ensure your private key has correct permissions:

```bash
chmod 600 ./keys/private.key
```

- If the connection times out, check:
  - Server accessibility with `ping`.
  - Firewall rules for port `21098`.

## Contact

For questions or support, contact:

- **Email**: juan@silverspringrecords.com
- **Phone**: 404-906-8831

---

&copy; 2024 Silver Spring Records
