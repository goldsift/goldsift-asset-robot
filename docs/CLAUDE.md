# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram bot project for managing cryptocurrency asset monitoring with price alerts. The system consists of:
- Next.js + TypeScript frontend with admin panel
- SQLite database
- Telegram bot using node-telegram-bot-api
- Binance REST API integration for price data
- Docker deployment

## Architecture

### Core Components
- **Telegram Bot Service**: Handles group commands (/watch, /list, /unwatch) with group whitelist validation
- **Price Monitor**: Scheduled tasks that fetch prices from Binance API and trigger alerts based on configurable thresholds
- **Admin Panel**: Web interface for configuration management, group whitelist, and watchlist oversight
- **Configuration System**: Key-value configuration table storing bot tokens, price thresholds, admin credentials

### Database Schema
- `config` table: Key-value pairs for system configuration (bot_token, price_threshold, admin_credentials)
- `groups` table: Whitelisted Telegram groups
- `watchlists` table: Tracked assets with reference prices and custom thresholds
- Asset types supported: spot, futures, alpha

### Key Features
- Chinese language interface for all user-facing components
- Group-based asset tracking with configurable price alert thresholds (default 5%)
- Real-time price monitoring with Binance API integration
- Admin panel for system configuration and monitoring

## Development Commands

*Note: Commands will be added as the project is built according to development-plan.md*

## Project Structure

*Note: Structure will be established during initial setup phase following Next.js + TypeScript conventions*

## Important Implementation Notes

- All configuration must be stored in the database config table, not environment variables
- Bot token and admin credentials are managed through the admin panel
- Price thresholds are customizable per watchlist item with 5% default
- Group whitelist validation is required for all bot interactions
- Chinese language support for all user interfaces
- Docker deployment with proper environment isolation

## Development Workflow

Follow the step-by-step development plan in `development-plan.md`. The project is divided into 5 phases:
1. Project foundation and database setup
2. Telegram bot core functionality
3. Price monitoring and alert system
4. Admin panel development
5. Optimization and Docker deployment

Refer to `init.md` for detailed functional requirements.