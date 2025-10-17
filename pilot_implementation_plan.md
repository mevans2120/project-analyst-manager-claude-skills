# Pilot Implementation Plan: Project Manager Skills

## Executive Summary

This plan provides a detailed, step-by-step implementation guide for building two complementary Claude Code skills: **Project Analyzer** (read-only) and **Project Manager** (write operations). The pilot focuses on Phase 1 MVP delivery within 2 weeks, with emphasis on practical testing using a dedicated test repository before production deployment.

**Timeline**: 2 weeks (10 working days)
**Target Repositories**: `codymd-hacknback-main`, `care-tracker-mobile`
**Primary Risk**: Duplicate issue creation - mitigated by robust state tracking
**Success Criteria**: 90% reduction in hidden TODOs, zero duplicate issues, 30-45 min daily time savings

---

## Phase 1: MVP Implementation (2 Weeks)

### Week 1: Core Infrastructure & Testing

#### Day 1: Project Setup & Test Repository

**Tasks**:
1. Create Python project structure
2. Set up test repository for safe experimentation
3. Configure GitHub authentication
4. Initialize state tracking system

**Deliverables**:
```
project-manager-skills/
├── analyzer/
│   ├── __init__.py
│   ├── scanner.py          # File system scanning
│   ├── parser.py           # TODO/task parsing
│   ├── github_client.py    # Read-only GitHub operations
│   └── reporter.py         # Report generation
├── manager/
│   ├── __init__.py
│   ├── issue_creator.py    # GitHub issue creation
│   ├── state_tracker.py    # .project-state.json management
│   └── label_manager.py    # Label operations
├── shared/
│   ├── __init__.py
│   ├── config.py           # Configuration loading
│   └── utils.py            # Shared utilities
├── tests/
│   ├── test_scanner.py
│   ├── test_parser.py
│   ├── test_issue_creator.py
│   └── fixtures/           # Test files
├── config.json             # Main configuration
├── requirements.txt
├── README.md
└── .env.example
```

**Setup Commands**:
```bash
# Create project structure
mkdir -p ~/projects/project-manager-skills/{analyzer,manager,shared,tests/fixtures}
cd ~/projects/project-manager-skills

# Initialize Python environment
python3 -m venv venv
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt << 'EOF'
requests==2.31.0
PyGithub==2.1.1
python-dotenv==1.0.0
pyyaml==6.0.1
pytest==7.4.3
pytest-mock==3.12.0
black==23.12.0
flake8==6.1.0
EOF

pip install -r requirements.txt

# Create .env.example
cat > .env.example << 'EOF'
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=your_github_username
EOF

# Copy and configure actual .env
cp .env.example .env
# Edit .env with your actual token
```

**Test Repository Setup**:
```bash
# Create a test repository on GitHub first (via web UI)
# Name it: project-manager-test-repo

# Clone it locally
cd ~/projects
git clone https://github.com/YOUR_USERNAME/project-manager-test-repo.git
cd project-manager-test-repo

# Create test structure
mkdir -p docs/planning memory-bank src

# Add test TODOs
cat > src/example.py << 'EOF'
def calculate_total(items):
    # TODO: Add validation for negative prices
    # FIXME: This doesn't handle empty lists
    total = sum(item['price'] for item in items)
    return total

# TODO: Implement discount calculation feature
EOF

# Add test markdown with task lists
cat > docs/planning/features.md << 'EOF'
# Feature Backlog

## Authentication
- [ ] Implement user login
- [ ] Add password reset functionality
- [x] Set up OAuth providers

## Payment Processing
- [ ] Integrate Stripe
- [ ] Add invoice generation
- [ ] Support multiple currencies
EOF

# Commit and push
git add .
git commit -m "Add test TODOs and task lists"
git push origin main
```

**Success Metrics for Day 1**:
- [ ] Python project structure created
- [ ] Virtual environment configured with all dependencies
- [ ] Test repository created with sample TODOs
- [ ] GitHub token configured and tested
- [ ] Can authenticate to GitHub API successfully

---

#### Day 2: Core Scanner & Parser Implementation

**File: `shared/config.py`**
```python
"""Configuration management for project manager skills."""
import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration manager."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration.

        Args:
            config_path: Path to config.json file
        """
        self.config_path = config_path or "config.json"
        self._config = self._load_config()
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.github_owner = os.getenv("GITHUB_OWNER")

        if not self.github_token:
            raise ValueError("GITHUB_TOKEN not found in environment")

    def _load_config(self) -> Dict:
        """Load configuration from JSON file."""
        if not Path(self.config_path).exists():
            return self._default_config()

        with open(self.config_path, 'r') as f:
            return json.load(f)

    def _default_config(self) -> Dict:
        """Return default configuration."""
        return {
            "repositories": [],
            "github": {
                "defaultLabels": ["auto-created"],
                "issueTitlePrefix": "[PM]"
            },
            "reporting": {
                "schedule": "daily",
                "outputPath": "docs/reports"
            }
        }

    @property
    def repositories(self) -> List[Dict]:
        """Get list of configured repositories."""
        return self._config.get("repositories", [])

    @property
    def default_labels(self) -> List[str]:
        """Get default labels for issues."""
        return self._config.get("github", {}).get("defaultLabels", [])

    @property
    def issue_prefix(self) -> str:
        """Get issue title prefix."""
        return self._config.get("github", {}).get("issueTitlePrefix", "[PM]")
```

**File: `analyzer/scanner.py`**
```python
"""File system scanner for project analysis."""
import os
from pathlib import Path
from typing import List, Dict, Set
import re

class FileScanner:
    """Scans repository files for TODOs and task lists."""

    # File extensions to scan for TODOs
    CODE_EXTENSIONS = {
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go',
        '.rb', '.php', '.swift', '.kt', '.rs', '.c', '.cpp', '.h'
    }

    # Markdown extensions
    MARKDOWN_EXTENSIONS = {'.md', '.markdown'}

    # Directories to skip
    SKIP_DIRS = {
        '.git', '.svn', 'node_modules', 'venv', 'env', '__pycache__',
        'dist', 'build', '.pytest_cache', '.venv', 'vendor'
    }

    def __init__(self, repo_path: str):
        """Initialize scanner.

        Args:
            repo_path: Path to repository root
        """
        self.repo_path = Path(repo_path)
        if not self.repo_path.exists():
            raise ValueError(f"Repository path does not exist: {repo_path}")

    def find_markdown_files(self, search_paths: List[str] = None) -> List[Path]:
        """Find all markdown files in specified paths.

        Args:
            search_paths: List of paths to search within repo (e.g., ['docs', 'memory-bank'])
                         If None, searches entire repo.

        Returns:
            List of Path objects for markdown files
        """
        markdown_files = []

        if search_paths:
            search_dirs = [self.repo_path / path for path in search_paths]
        else:
            search_dirs = [self.repo_path]

        for search_dir in search_dirs:
            if not search_dir.exists():
                continue

            for root, dirs, files in os.walk(search_dir):
                # Skip ignored directories
                dirs[:] = [d for d in dirs if d not in self.SKIP_DIRS]

                for file in files:
                    if Path(file).suffix in self.MARKDOWN_EXTENSIONS:
                        markdown_files.append(Path(root) / file)

        return markdown_files

    def find_code_files(self) -> List[Path]:
        """Find all code files in repository.

        Returns:
            List of Path objects for code files
        """
        code_files = []

        for root, dirs, files in os.walk(self.repo_path):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in self.SKIP_DIRS]

            for file in files:
                if Path(file).suffix in self.CODE_EXTENSIONS:
                    code_files.append(Path(root) / file)

        return code_files

    def get_relative_path(self, file_path: Path) -> str:
        """Get path relative to repository root.

        Args:
            file_path: Absolute path to file

        Returns:
            Relative path string
        """
        try:
            return str(file_path.relative_to(self.repo_path))
        except ValueError:
            return str(file_path)
```

**File: `analyzer/parser.py`**
```python
"""Parser for TODOs and task lists."""
import re
from typing import List, Dict, Optional
from pathlib import Path
from dataclasses import dataclass

@dataclass
class TodoItem:
    """Represents a TODO item found in code or documentation."""
    file_path: str
    line_number: int
    text: str
    todo_type: str  # 'TODO', 'FIXME', 'HACK', 'NOTE', etc.
    context: Optional[str] = None  # Surrounding code for context

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'file_path': self.file_path,
            'line_number': self.line_number,
            'text': self.text,
            'todo_type': self.todo_type,
            'context': self.context
        }

@dataclass
class TaskItem:
    """Represents a task list item from markdown."""
    file_path: str
    line_number: int
    text: str
    is_completed: bool
    section: Optional[str] = None  # Header/section the task is under

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'file_path': self.file_path,
            'line_number': self.line_number,
            'text': self.text,
            'is_completed': self.is_completed,
            'section': self.section
        }

class TodoParser:
    """Parses TODO comments from code files."""

    # Regex patterns for TODO comments
    TODO_PATTERNS = [
        r'#\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+)',  # Python, Ruby, Shell
        r'//\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+)',  # JavaScript, Go, C++
        r'/\*\s*(TODO|FIXME|HACK|XXX|NOTE|BUG)[\s:]+(.+?)\*/',  # Multi-line comment
    ]

    def __init__(self):
        """Initialize parser."""
        self.compiled_patterns = [re.compile(p, re.IGNORECASE) for p in self.TODO_PATTERNS]

    def parse_file(self, file_path: Path, relative_path: str) -> List[TodoItem]:
        """Parse a code file for TODO comments.

        Args:
            file_path: Path to the file
            relative_path: Path relative to repo root

        Returns:
            List of TodoItem objects
        """
        todos = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, start=1):
                for pattern in self.compiled_patterns:
                    match = pattern.search(line)
                    if match:
                        todo_type = match.group(1).upper()
                        text = match.group(2).strip()

                        # Get context (line before and after)
                        context_lines = []
                        if line_num > 1:
                            context_lines.append(lines[line_num - 2].strip())
                        context_lines.append(line.strip())
                        if line_num < len(lines):
                            context_lines.append(lines[line_num].strip())

                        context = '\n'.join(context_lines)

                        todos.append(TodoItem(
                            file_path=relative_path,
                            line_number=line_num,
                            text=text,
                            todo_type=todo_type,
                            context=context
                        ))
                        break  # Only match first pattern per line

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return todos

class TaskListParser:
    """Parses task lists from markdown files."""

    # Regex for markdown task lists
    TASK_PATTERN = re.compile(r'^\s*-\s+\[([ xX])\]\s+(.+)$')
    HEADER_PATTERN = re.compile(r'^(#{1,6})\s+(.+)$')

    def parse_file(self, file_path: Path, relative_path: str) -> List[TaskItem]:
        """Parse a markdown file for task lists.

        Args:
            file_path: Path to the markdown file
            relative_path: Path relative to repo root

        Returns:
            List of TaskItem objects
        """
        tasks = []
        current_section = None

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, start=1):
                # Check for headers
                header_match = self.HEADER_PATTERN.match(line)
                if header_match:
                    current_section = header_match.group(2).strip()
                    continue

                # Check for task items
                task_match = self.TASK_PATTERN.match(line)
                if task_match:
                    is_completed = task_match.group(1).lower() == 'x'
                    text = task_match.group(2).strip()

                    tasks.append(TaskItem(
                        file_path=relative_path,
                        line_number=line_num,
                        text=text,
                        is_completed=is_completed,
                        section=current_section
                    ))

        except Exception as e:
            print(f"Error parsing {file_path}: {e}")

        return tasks
```

**Testing Script: `tests/test_parser.py`**
```python
"""Tests for parser functionality."""
import pytest
from pathlib import Path
from analyzer.parser import TodoParser, TaskListParser, TodoItem, TaskItem

def test_todo_parser_python():
    """Test parsing Python TODO comments."""
    parser = TodoParser()
    test_file = Path("tests/fixtures/test_python.py")

    # Create test file
    test_file.parent.mkdir(parents=True, exist_ok=True)
    test_file.write_text("""
def example():
    # TODO: Implement this function
    # FIXME: Handle edge cases
    pass
""")

    todos = parser.parse_file(test_file, "test_python.py")

    assert len(todos) == 2
    assert todos[0].todo_type == "TODO"
    assert "Implement this function" in todos[0].text
    assert todos[1].todo_type == "FIXME"

def test_task_list_parser():
    """Test parsing markdown task lists."""
    parser = TaskListParser()
    test_file = Path("tests/fixtures/test_tasks.md")

    # Create test file
    test_file.parent.mkdir(parents=True, exist_ok=True)
    test_file.write_text("""
# Features

## Authentication
- [ ] Implement login
- [x] Add OAuth
- [ ] Password reset

## Payment
- [ ] Stripe integration
""")

    tasks = parser.parse_file(test_file, "test_tasks.md")

    assert len(tasks) == 4
    assert tasks[0].section == "Authentication"
    assert not tasks[0].is_completed
    assert tasks[1].is_completed
    assert "Implement login" in tasks[0].text

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Day 2 Commands**:
```bash
cd ~/projects/project-manager-skills

# Create all files (use the code above)

# Run tests
pytest tests/test_parser.py -v

# Test on real repository
python -c "
from analyzer.scanner import FileScanner
from analyzer.parser import TodoParser, TaskListParser

scanner = FileScanner('../project-manager-test-repo')
print('Markdown files:', len(scanner.find_markdown_files()))
print('Code files:', len(scanner.find_code_files()))
"
```

**Success Metrics for Day 2**:
- [ ] Scanner finds all relevant files in test repo
- [ ] Parser correctly identifies TODOs in code
- [ ] Parser correctly parses markdown task lists
- [ ] All unit tests pass
- [ ] Can extract at least 5 items from test repository

---

#### Day 3: GitHub Integration & State Tracking

**File: `analyzer/github_client.py`**
```python
"""Read-only GitHub API client."""
from typing import List, Dict, Optional
from github import Github, GithubException
from dataclasses import dataclass

@dataclass
class GitHubIssue:
    """Simplified representation of a GitHub issue."""
    number: int
    title: str
    state: str
    labels: List[str]
    url: str
    body: str

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'number': self.number,
            'title': self.title,
            'state': self.state,
            'labels': self.labels,
            'url': self.url,
            'body': self.body
        }

class GitHubClient:
    """Read-only GitHub API client for analysis."""

    def __init__(self, token: str, owner: str, repo_name: str):
        """Initialize GitHub client.

        Args:
            token: GitHub personal access token
            owner: Repository owner
            repo_name: Repository name
        """
        self.gh = Github(token)
        self.owner = owner
        self.repo_name = repo_name
        self.repo = self.gh.get_repo(f"{owner}/{repo_name}")

    def get_all_issues(self, state: str = "all") -> List[GitHubIssue]:
        """Get all issues from the repository.

        Args:
            state: Issue state filter ('open', 'closed', 'all')

        Returns:
            List of GitHubIssue objects
        """
        issues = []

        try:
            for issue in self.repo.get_issues(state=state):
                if issue.pull_request:  # Skip pull requests
                    continue

                issues.append(GitHubIssue(
                    number=issue.number,
                    title=issue.title,
                    state=issue.state,
                    labels=[label.name for label in issue.labels],
                    url=issue.html_url,
                    body=issue.body or ""
                ))
        except GithubException as e:
            print(f"Error fetching issues: {e}")

        return issues

    def get_repository_labels(self) -> List[str]:
        """Get all labels defined in the repository.

        Returns:
            List of label names
        """
        try:
            return [label.name for label in self.repo.get_labels()]
        except GithubException as e:
            print(f"Error fetching labels: {e}")
            return []

    def search_issues_by_keyword(self, keyword: str) -> List[GitHubIssue]:
        """Search for issues containing a keyword.

        Args:
            keyword: Keyword to search for

        Returns:
            List of matching GitHubIssue objects
        """
        issues = []

        try:
            query = f"repo:{self.owner}/{self.repo_name} {keyword}"
            results = self.gh.search_issues(query)

            for issue in results:
                if issue.pull_request:
                    continue

                issues.append(GitHubIssue(
                    number=issue.number,
                    title=issue.title,
                    state=issue.state,
                    labels=[label.name for label in issue.labels],
                    url=issue.html_url,
                    body=issue.body or ""
                ))
        except GithubException as e:
            print(f"Error searching issues: {e}")

        return issues
```

**File: `manager/state_tracker.py`**
```python
"""State tracking to prevent duplicate issue creation."""
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Set, Optional
from datetime import datetime

class StateTracker:
    """Manages project state to prevent duplicate operations."""

    def __init__(self, repo_path: str, state_file: str = ".project-state.json"):
        """Initialize state tracker.

        Args:
            repo_path: Path to repository
            state_file: Name of state file (relative to repo)
        """
        self.repo_path = Path(repo_path)
        self.state_file_path = self.repo_path / state_file
        self.state = self._load_state()

    def _load_state(self) -> Dict:
        """Load state from JSON file."""
        if not self.state_file_path.exists():
            return {
                'version': '1.0',
                'last_updated': None,
                'processed_todos': {},
                'processed_tasks': {},
                'created_issues': [],
                'checksums': {}
            }

        try:
            with open(self.state_file_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Could not parse {self.state_file_path}, using empty state")
            return self._load_state()  # Return default state

    def save_state(self):
        """Save state to JSON file."""
        self.state['last_updated'] = datetime.now().isoformat()

        with open(self.state_file_path, 'w') as f:
            json.dump(self.state, indent=2, fp=f)

    def _generate_item_hash(self, item: Dict) -> str:
        """Generate a unique hash for an item.

        Args:
            item: Dictionary with file_path, line_number, and text

        Returns:
            SHA256 hash string
        """
        key = f"{item['file_path']}:{item['line_number']}:{item['text']}"
        return hashlib.sha256(key.encode()).hexdigest()

    def is_todo_processed(self, todo: Dict) -> bool:
        """Check if a TODO has already been processed.

        Args:
            todo: TodoItem dictionary

        Returns:
            True if already processed
        """
        item_hash = self._generate_item_hash(todo)
        return item_hash in self.state['processed_todos']

    def mark_todo_processed(self, todo: Dict, issue_number: Optional[int] = None):
        """Mark a TODO as processed.

        Args:
            todo: TodoItem dictionary
            issue_number: GitHub issue number if created
        """
        item_hash = self._generate_item_hash(todo)
        self.state['processed_todos'][item_hash] = {
            'file_path': todo['file_path'],
            'line_number': todo['line_number'],
            'text': todo['text'],
            'processed_at': datetime.now().isoformat(),
            'issue_number': issue_number
        }

    def is_task_processed(self, task: Dict) -> bool:
        """Check if a task has already been processed.

        Args:
            task: TaskItem dictionary

        Returns:
            True if already processed
        """
        item_hash = self._generate_item_hash(task)
        return item_hash in self.state['processed_tasks']

    def mark_task_processed(self, task: Dict, issue_number: Optional[int] = None):
        """Mark a task as processed.

        Args:
            task: TaskItem dictionary
            issue_number: GitHub issue number if created
        """
        item_hash = self._generate_item_hash(task)
        self.state['processed_tasks'][item_hash] = {
            'file_path': task['file_path'],
            'line_number': task['line_number'],
            'text': task['text'],
            'processed_at': datetime.now().isoformat(),
            'issue_number': issue_number
        }

    def add_created_issue(self, issue_number: int, title: str, source_type: str, source: Dict):
        """Record a newly created issue.

        Args:
            issue_number: GitHub issue number
            title: Issue title
            source_type: 'todo' or 'task'
            source: Source item dictionary
        """
        self.state['created_issues'].append({
            'issue_number': issue_number,
            'title': title,
            'source_type': source_type,
            'source': source,
            'created_at': datetime.now().isoformat()
        })

    def get_created_issues(self) -> List[Dict]:
        """Get list of all created issues.

        Returns:
            List of issue dictionaries
        """
        return self.state['created_issues']

    def update_file_checksum(self, file_path: str, checksum: str):
        """Update checksum for a file.

        Args:
            file_path: Relative path to file
            checksum: File checksum (e.g., SHA256)
        """
        self.state['checksums'][file_path] = checksum

    def has_file_changed(self, file_path: str, current_checksum: str) -> bool:
        """Check if a file has changed since last processing.

        Args:
            file_path: Relative path to file
            current_checksum: Current file checksum

        Returns:
            True if file has changed or is new
        """
        old_checksum = self.state['checksums'].get(file_path)
        return old_checksum != current_checksum
```

**Testing Script: `tests/test_state_tracker.py`**
```python
"""Tests for state tracker."""
import pytest
from pathlib import Path
import tempfile
import shutil
from manager.state_tracker import StateTracker

@pytest.fixture
def temp_repo():
    """Create a temporary repository directory."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

def test_state_tracker_initialization(temp_repo):
    """Test state tracker initialization."""
    tracker = StateTracker(temp_repo)

    assert tracker.state['version'] == '1.0'
    assert 'processed_todos' in tracker.state
    assert 'processed_tasks' in tracker.state

def test_todo_processing(temp_repo):
    """Test TODO processing tracking."""
    tracker = StateTracker(temp_repo)

    todo = {
        'file_path': 'src/main.py',
        'line_number': 42,
        'text': 'Implement feature X'
    }

    # Initially not processed
    assert not tracker.is_todo_processed(todo)

    # Mark as processed
    tracker.mark_todo_processed(todo, issue_number=123)

    # Now should be processed
    assert tracker.is_todo_processed(todo)

    # Save and reload
    tracker.save_state()
    tracker2 = StateTracker(temp_repo)
    assert tracker2.is_todo_processed(todo)

def test_duplicate_prevention(temp_repo):
    """Test that identical items are detected as duplicates."""
    tracker = StateTracker(temp_repo)

    todo1 = {
        'file_path': 'src/main.py',
        'line_number': 42,
        'text': 'Fix bug'
    }

    todo2 = {
        'file_path': 'src/main.py',
        'line_number': 42,
        'text': 'Fix bug'
    }

    tracker.mark_todo_processed(todo1)

    # Same content should be marked as processed
    assert tracker.is_todo_processed(todo2)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Day 3 Commands**:
```bash
cd ~/projects/project-manager-skills

# Run tests
pytest tests/test_state_tracker.py -v

# Test GitHub connection
python -c "
from shared.config import Config
from analyzer.github_client import GitHubClient

config = Config()
client = GitHubClient(
    config.github_token,
    config.github_owner,
    'project-manager-test-repo'
)

issues = client.get_all_issues()
print(f'Found {len(issues)} issues')
labels = client.get_repository_labels()
print(f'Repository labels: {labels}')
"
```

**Success Metrics for Day 3**:
- [ ] Can authenticate to GitHub API
- [ ] Can fetch existing issues from test repo
- [ ] State tracker prevents duplicate processing
- [ ] State persists across sessions
- [ ] All unit tests pass

---

#### Day 4: Issue Creation & Label Management

**File: `manager/label_manager.py`**
```python
"""GitHub label management."""
from typing import List, Dict
from github import Github, GithubException

class LabelManager:
    """Manages GitHub labels for issues."""

    # Standard label definitions
    STANDARD_LABELS = {
        'feature': {'color': '0e8a16', 'description': 'New functionality'},
        'bug': {'color': 'd73a4a', 'description': 'Something isn\'t working'},
        'documentation': {'color': '0075ca', 'description': 'Documentation improvements'},
        'refactor': {'color': 'fbca04', 'description': 'Code improvement without functionality change'},
        'infrastructure': {'color': '5319e7', 'description': 'DevOps, build, CI/CD'},

        'priority-high': {'color': 'b60205', 'description': 'Critical for current sprint'},
        'priority-medium': {'color': 'fbca04', 'description': 'Important but not urgent'},
        'priority-low': {'color': 'c2e0c6', 'description': 'Nice to have'},

        'auto-created': {'color': 'ededed', 'description': 'Automatically created by PM tool'},
        'from-todo': {'color': 'bfdadc', 'description': 'Created from TODO comment'},
        'from-spec': {'color': 'bfdadc', 'description': 'Created from specification doc'},
    }

    def __init__(self, token: str, owner: str, repo_name: str):
        """Initialize label manager.

        Args:
            token: GitHub personal access token
            owner: Repository owner
            repo_name: Repository name
        """
        self.gh = Github(token)
        self.repo = self.gh.get_repo(f"{owner}/{repo_name}")

    def ensure_labels_exist(self) -> Dict[str, bool]:
        """Ensure all standard labels exist in the repository.

        Returns:
            Dictionary mapping label names to creation status
        """
        results = {}
        existing_labels = {label.name for label in self.repo.get_labels()}

        for label_name, label_config in self.STANDARD_LABELS.items():
            if label_name in existing_labels:
                results[label_name] = False  # Already exists
                continue

            try:
                self.repo.create_label(
                    name=label_name,
                    color=label_config['color'],
                    description=label_config.get('description', '')
                )
                results[label_name] = True  # Created
                print(f"Created label: {label_name}")
            except GithubException as e:
                print(f"Error creating label {label_name}: {e}")
                results[label_name] = False

        return results

    def categorize_todo(self, todo_text: str, todo_type: str) -> List[str]:
        """Determine appropriate labels for a TODO.

        Args:
            todo_text: Text of the TODO
            todo_type: Type (TODO, FIXME, etc.)

        Returns:
            List of label names
        """
        labels = ['auto-created', 'from-todo']

        # Determine category based on type and keywords
        if todo_type in ['FIXME', 'BUG']:
            labels.append('bug')
            labels.append('priority-medium')
        elif todo_type in ['HACK', 'XXX']:
            labels.append('refactor')
            labels.append('priority-low')
        else:  # TODO, NOTE
            # Check keywords in text
            text_lower = todo_text.lower()
            if any(word in text_lower for word in ['implement', 'add', 'create', 'feature']):
                labels.append('feature')
            elif any(word in text_lower for word in ['doc', 'comment', 'explain']):
                labels.append('documentation')
            elif any(word in text_lower for word in ['refactor', 'clean', 'improve']):
                labels.append('refactor')
            else:
                labels.append('feature')  # Default

            # Determine priority from keywords
            if any(word in text_lower for word in ['urgent', 'critical', 'asap', 'important']):
                labels.append('priority-high')
            elif any(word in text_lower for word in ['later', 'nice', 'someday']):
                labels.append('priority-low')
            else:
                labels.append('priority-medium')

        return labels

    def categorize_task(self, task_text: str, section: str = None) -> List[str]:
        """Determine appropriate labels for a task.

        Args:
            task_text: Text of the task
            section: Section header the task is under

        Returns:
            List of label names
        """
        labels = ['auto-created', 'from-spec']

        # Use section as hint
        text_to_analyze = f"{section or ''} {task_text}".lower()

        # Category detection
        if any(word in text_to_analyze for word in ['bug', 'fix', 'error', 'issue']):
            labels.append('bug')
        elif any(word in text_to_analyze for word in ['doc', 'readme', 'guide']):
            labels.append('documentation')
        elif any(word in text_to_analyze for word in ['refactor', 'clean', 'improve', 'optimize']):
            labels.append('refactor')
        elif any(word in text_to_analyze for word in ['deploy', 'ci', 'build', 'infra']):
            labels.append('infrastructure')
        else:
            labels.append('feature')

        # Priority detection
        if any(word in text_to_analyze for word in ['critical', 'urgent', 'blocker']):
            labels.append('priority-high')
        elif any(word in text_to_analyze for word in ['low', 'nice', 'optional']):
            labels.append('priority-low')
        else:
            labels.append('priority-medium')

        return labels
```

**File: `manager/issue_creator.py`**
```python
"""GitHub issue creation."""
from typing import List, Dict, Optional
from github import Github, GithubException
from manager.label_manager import LabelManager

class IssueCreator:
    """Creates GitHub issues from TODOs and tasks."""

    def __init__(self, token: str, owner: str, repo_name: str, title_prefix: str = "[PM]"):
        """Initialize issue creator.

        Args:
            token: GitHub personal access token
            owner: Repository owner
            repo_name: Repository name
            title_prefix: Prefix for issue titles
        """
        self.gh = Github(token)
        self.repo = self.gh.get_repo(f"{owner}/{repo_name}")
        self.title_prefix = title_prefix
        self.label_manager = LabelManager(token, owner, repo_name)

    def create_issue_from_todo(self, todo: Dict, labels: List[str] = None) -> Optional[int]:
        """Create a GitHub issue from a TODO item.

        Args:
            todo: TodoItem dictionary
            labels: Optional list of label names

        Returns:
            Issue number if created, None if failed
        """
        # Generate title
        title = f"{self.title_prefix} {todo['text'][:80]}"

        # Generate body
        body = f"""## Source
**Type:** `{todo['todo_type']}`
**File:** `{todo['file_path']}`
**Line:** {todo['line_number']}

## Context
```
{todo.get('context', 'No context available')}
```

## Description
{todo['text']}

---
*This issue was automatically created from a TODO comment in the codebase.*
"""

        # Determine labels
        if labels is None:
            labels = self.label_manager.categorize_todo(todo['text'], todo['todo_type'])

        try:
            issue = self.repo.create_issue(
                title=title,
                body=body,
                labels=labels
            )
            print(f"Created issue #{issue.number}: {title}")
            return issue.number
        except GithubException as e:
            print(f"Error creating issue: {e}")
            return None

    def create_issue_from_task(self, task: Dict, labels: List[str] = None) -> Optional[int]:
        """Create a GitHub issue from a task list item.

        Args:
            task: TaskItem dictionary
            labels: Optional list of label names

        Returns:
            Issue number if created, None if failed
        """
        # Skip completed tasks
        if task.get('is_completed', False):
            return None

        # Generate title
        title = f"{self.title_prefix} {task['text'][:80]}"

        # Generate body
        section_text = f"**Section:** {task['section']}" if task.get('section') else ""

        body = f"""## Source
**File:** `{task['file_path']}`
**Line:** {task['line_number']}
{section_text}

## Description
{task['text']}

---
*This issue was automatically created from a task list in the planning documentation.*
"""

        # Determine labels
        if labels is None:
            labels = self.label_manager.categorize_task(task['text'], task.get('section'))

        try:
            issue = self.repo.create_issue(
                title=title,
                body=body,
                labels=labels
            )
            print(f"Created issue #{issue.number}: {title}")
            return issue.number
        except GithubException as e:
            print(f"Error creating issue: {e}")
            return None

    def create_issues_batch(self, todos: List[Dict], tasks: List[Dict]) -> Dict[str, List[int]]:
        """Create multiple issues at once.

        Args:
            todos: List of TodoItem dictionaries
            tasks: List of TaskItem dictionaries

        Returns:
            Dictionary with 'todos' and 'tasks' keys containing created issue numbers
        """
        results = {'todos': [], 'tasks': []}

        for todo in todos:
            issue_num = self.create_issue_from_todo(todo)
            if issue_num:
                results['todos'].append(issue_num)

        for task in tasks:
            issue_num = self.create_issue_from_task(task)
            if issue_num:
                results['tasks'].append(issue_num)

        return results
```

**Day 4 Commands**:
```bash
cd ~/projects/project-manager-skills

# Test label creation
python -c "
from shared.config import Config
from manager.label_manager import LabelManager

config = Config()
label_mgr = LabelManager(config.github_token, config.github_owner, 'project-manager-test-repo')
results = label_mgr.ensure_labels_exist()
print('Label creation results:', results)
"

# Test issue creation (dry run on test repo)
python -c "
from shared.config import Config
from manager.issue_creator import IssueCreator

config = Config()
creator = IssueCreator(config.github_token, config.github_owner, 'project-manager-test-repo')

# Create a test issue from a mock TODO
test_todo = {
    'file_path': 'src/test.py',
    'line_number': 10,
    'text': 'Implement user authentication',
    'todo_type': 'TODO',
    'context': '# TODO: Implement user authentication\n# This is critical for the next release'
}

issue_num = creator.create_issue_from_todo(test_todo)
print(f'Created issue: #{issue_num}')
"
```

**Success Metrics for Day 4**:
- [ ] Can create labels in test repository
- [ ] Can create issues from TODOs
- [ ] Can create issues from task lists
- [ ] Labels are applied correctly
- [ ] Issue formatting is clear and useful
- [ ] At least 3 test issues created successfully

---

#### Day 5: End-to-End Integration & Reporter

**File: `analyzer/reporter.py`**
```python
"""Report generation for analysis results."""
from typing import List, Dict
from datetime import datetime
from pathlib import Path

class Reporter:
    """Generates analysis and status reports."""

    def __init__(self, output_path: str = "docs/reports"):
        """Initialize reporter.

        Args:
            output_path: Directory for report output
        """
        self.output_path = Path(output_path)
        self.output_path.mkdir(parents=True, exist_ok=True)

    def generate_analysis_report(
        self,
        repo_name: str,
        todos: List[Dict],
        tasks: List[Dict],
        existing_issues: List[Dict],
        created_issues: Dict[str, List[int]]
    ) -> str:
        """Generate analysis report.

        Args:
            repo_name: Repository name
            todos: List of found TODOs
            tasks: List of found tasks
            existing_issues: List of existing GitHub issues
            created_issues: Dictionary of created issue numbers

        Returns:
            Path to generated report
        """
        timestamp = datetime.now().strftime("%Y-%m-%d-%H%M")
        report_file = self.output_path / f"analysis-{repo_name}-{timestamp}.md"

        # Calculate statistics
        total_todos = len(todos)
        total_tasks = len([t for t in tasks if not t.get('is_completed', False)])
        total_created = len(created_issues.get('todos', [])) + len(created_issues.get('tasks', []))

        # Group TODOs by file
        todos_by_file = {}
        for todo in todos:
            file_path = todo['file_path']
            if file_path not in todos_by_file:
                todos_by_file[file_path] = []
            todos_by_file[file_path].append(todo)

        # Group tasks by file
        tasks_by_file = {}
        for task in tasks:
            if task.get('is_completed', False):
                continue
            file_path = task['file_path']
            if file_path not in tasks_by_file:
                tasks_by_file[file_path] = []
            tasks_by_file[file_path].append(task)

        # Generate report
        report = f"""# Project Analysis Report: {repo_name}

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Summary

- **Total TODOs Found:** {total_todos}
- **Total Incomplete Tasks:** {total_tasks}
- **Existing GitHub Issues:** {len(existing_issues)}
- **New Issues Created:** {total_created}

## TODO Comments by File

"""

        for file_path, file_todos in sorted(todos_by_file.items()):
            report += f"### `{file_path}`\n\n"
            for todo in file_todos:
                report += f"- **Line {todo['line_number']}** [{todo['todo_type']}]: {todo['text']}\n"
            report += "\n"

        report += "\n## Task Lists by File\n\n"

        for file_path, file_tasks in sorted(tasks_by_file.items()):
            report += f"### `{file_path}`\n\n"
            for task in file_tasks:
                section = f" ({task['section']})" if task.get('section') else ""
                report += f"- **Line {task['line_number']}**{section}: {task['text']}\n"
            report += "\n"

        if total_created > 0:
            report += "\n## Created Issues\n\n"

            if created_issues.get('todos'):
                report += "### From TODOs\n\n"
                for issue_num in created_issues['todos']:
                    report += f"- Issue #{issue_num}\n"
                report += "\n"

            if created_issues.get('tasks'):
                report += "### From Task Lists\n\n"
                for issue_num in created_issues['tasks']:
                    report += f"- Issue #{issue_num}\n"
                report += "\n"

        report += "\n---\n*Report generated by Project Manager Skills*\n"

        # Write report
        with open(report_file, 'w') as f:
            f.write(report)

        print(f"Report generated: {report_file}")
        return str(report_file)

    def generate_daily_status_report(
        self,
        repos_data: Dict[str, Dict]
    ) -> str:
        """Generate daily status report across multiple repositories.

        Args:
            repos_data: Dictionary mapping repo names to their data

        Returns:
            Path to generated report
        """
        date_str = datetime.now().strftime("%Y-%m-%d")
        report_file = self.output_path / f"daily-status-{date_str}.md"

        report = f"""# Daily Project Status Report

**Date:** {date_str}

## Summary

"""

        total_issues_created = 0
        total_todos_found = 0
        total_tasks_found = 0

        for repo_name, data in repos_data.items():
            issues_created = len(data.get('created_issues', {}).get('todos', [])) + \
                           len(data.get('created_issues', {}).get('tasks', []))
            total_issues_created += issues_created
            total_todos_found += len(data.get('todos', []))
            total_tasks_found += len([t for t in data.get('tasks', []) if not t.get('is_completed', False)])

        report += f"- **Repositories Analyzed:** {len(repos_data)}\n"
        report += f"- **Total TODOs Found:** {total_todos_found}\n"
        report += f"- **Total Tasks Found:** {total_tasks_found}\n"
        report += f"- **Issues Created Today:** {total_issues_created}\n\n"

        report += "## By Repository\n\n"

        for repo_name, data in sorted(repos_data.items()):
            report += f"### {repo_name}\n\n"

            todos = data.get('todos', [])
            tasks = [t for t in data.get('tasks', []) if not t.get('is_completed', False)]
            created = data.get('created_issues', {})
            created_count = len(created.get('todos', [])) + len(created.get('tasks', []))

            report += f"- **TODOs:** {len(todos)}\n"
            report += f"- **Incomplete Tasks:** {len(tasks)}\n"
            report += f"- **Issues Created:** {created_count}\n"

            if created_count > 0:
                report += "\n**Created Issues:**\n"
                for issue_num in created.get('todos', []):
                    report += f"- #{issue_num} (from TODO)\n"
                for issue_num in created.get('tasks', []):
                    report += f"- #{issue_num} (from task)\n"

            report += "\n"

        report += "\n---\n*Report generated by Project Manager Skills*\n"

        # Write report
        with open(report_file, 'w') as f:
            f.write(report)

        print(f"Daily report generated: {report_file}")
        return str(report_file)
```

**Main Integration Script: `run_analyzer.py`**
```python
#!/usr/bin/env python3
"""Main script to run project analysis and create issues."""
import sys
from pathlib import Path
from shared.config import Config
from analyzer.scanner import FileScanner
from analyzer.parser import TodoParser, TaskListParser
from analyzer.github_client import GitHubClient
from analyzer.reporter import Reporter
from manager.state_tracker import StateTracker
from manager.label_manager import LabelManager
from manager.issue_creator import IssueCreator

def analyze_repository(repo_path: str, repo_config: dict, config: Config, dry_run: bool = False):
    """Analyze a single repository.

    Args:
        repo_path: Path to repository
        repo_config: Repository configuration
        config: Global configuration
        dry_run: If True, don't create issues

    Returns:
        Dictionary with analysis results
    """
    repo_name = repo_config['name']
    print(f"\n{'='*60}")
    print(f"Analyzing repository: {repo_name}")
    print(f"{'='*60}\n")

    # Initialize components
    scanner = FileScanner(repo_path)
    todo_parser = TodoParser()
    task_parser = TaskListParser()
    github_client = GitHubClient(config.github_token, config.github_owner, repo_name)
    state_tracker = StateTracker(repo_path)

    # Scan for files
    print("Scanning repository...")
    planning_paths = repo_config.get('planningPaths', ['docs', 'memory-bank'])
    markdown_files = scanner.find_markdown_files(planning_paths)
    code_files = scanner.find_code_files()

    print(f"Found {len(markdown_files)} markdown files")
    print(f"Found {len(code_files)} code files")

    # Parse TODOs
    print("\nParsing TODOs...")
    all_todos = []
    for code_file in code_files:
        rel_path = scanner.get_relative_path(code_file)
        todos = todo_parser.parse_file(code_file, rel_path)
        all_todos.extend(todos)

    print(f"Found {len(all_todos)} TODO comments")

    # Parse task lists
    print("\nParsing task lists...")
    all_tasks = []
    for md_file in markdown_files:
        rel_path = scanner.get_relative_path(md_file)
        tasks = task_parser.parse_file(md_file, rel_path)
        all_tasks.extend(tasks)

    incomplete_tasks = [t for t in all_tasks if not t.is_completed]
    print(f"Found {len(incomplete_tasks)} incomplete tasks")

    # Filter out already processed items
    print("\nFiltering already processed items...")
    new_todos = [t for t in all_todos if not state_tracker.is_todo_processed(t.to_dict())]
    new_tasks = [t for t in incomplete_tasks if not state_tracker.is_task_processed(t.to_dict())]

    print(f"New TODOs to process: {len(new_todos)}")
    print(f"New tasks to process: {len(new_tasks)}")

    # Get existing issues
    print("\nFetching existing GitHub issues...")
    existing_issues = github_client.get_all_issues()
    print(f"Found {len(existing_issues)} existing issues")

    # Create issues (if not dry run)
    created_issues = {'todos': [], 'tasks': []}

    if not dry_run and (new_todos or new_tasks):
        print("\nCreating GitHub issues...")

        # Ensure labels exist
        label_manager = LabelManager(config.github_token, config.github_owner, repo_name)
        label_manager.ensure_labels_exist()

        # Create issue creator
        issue_creator = IssueCreator(
            config.github_token,
            config.github_owner,
            repo_name,
            config.issue_prefix
        )

        # Create issues from TODOs
        for todo in new_todos:
            todo_dict = todo.to_dict()
            issue_num = issue_creator.create_issue_from_todo(todo_dict)
            if issue_num:
                created_issues['todos'].append(issue_num)
                state_tracker.mark_todo_processed(todo_dict, issue_num)
                state_tracker.add_created_issue(issue_num, todo.text, 'todo', todo_dict)

        # Create issues from tasks
        for task in new_tasks:
            task_dict = task.to_dict()
            issue_num = issue_creator.create_issue_from_task(task_dict)
            if issue_num:
                created_issues['tasks'].append(issue_num)
                state_tracker.mark_task_processed(task_dict, issue_num)
                state_tracker.add_created_issue(issue_num, task.text, 'task', task_dict)

        # Save state
        state_tracker.save_state()
        print(f"\nCreated {len(created_issues['todos'])} issues from TODOs")
        print(f"Created {len(created_issues['tasks'])} issues from tasks")

    elif dry_run:
        print("\n[DRY RUN] Would create:")
        print(f"  - {len(new_todos)} issues from TODOs")
        print(f"  - {len(new_tasks)} issues from tasks")

    # Return results
    return {
        'todos': [t.to_dict() for t in all_todos],
        'tasks': [t.to_dict() for t in all_tasks],
        'existing_issues': [i.to_dict() for i in existing_issues],
        'created_issues': created_issues
    }

def main():
    """Main entry point."""
    # Parse arguments
    dry_run = '--dry-run' in sys.argv

    # Load configuration
    config = Config()

    if not config.repositories:
        print("Error: No repositories configured in config.json")
        print("Please add repository configuration.")
        return 1

    # Analyze each repository
    all_results = {}

    for repo_config in config.repositories:
        repo_name = repo_config['name']

        # Determine repository path (you may need to customize this)
        repo_path = Path.home() / 'projects' / repo_name

        if not repo_path.exists():
            print(f"Warning: Repository path not found: {repo_path}")
            print("Skipping...")
            continue

        try:
            results = analyze_repository(str(repo_path), repo_config, config, dry_run)
            all_results[repo_name] = results
        except Exception as e:
            print(f"Error analyzing {repo_name}: {e}")
            import traceback
            traceback.print_exc()

    # Generate reports
    if all_results:
        print("\n" + "="*60)
        print("Generating reports...")
        print("="*60 + "\n")

        reporter = Reporter(config._config['reporting']['outputPath'])

        # Generate individual reports
        for repo_name, results in all_results.items():
            reporter.generate_analysis_report(
                repo_name,
                results['todos'],
                results['tasks'],
                results['existing_issues'],
                results['created_issues']
            )

        # Generate daily summary
        reporter.generate_daily_status_report(all_results)

    print("\n" + "="*60)
    print("Analysis complete!")
    print("="*60)

    return 0

if __name__ == "__main__":
    sys.exit(main())
```

**Configuration File: `config.json`**
```json
{
  "repositories": [
    {
      "name": "project-manager-test-repo",
      "owner": "YOUR_GITHUB_USERNAME",
      "planningPaths": ["docs", "memory-bank"],
      "archiveAfterDays": 60
    }
  ],
  "github": {
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  },
  "reporting": {
    "schedule": "daily",
    "outputPath": "docs/reports"
  }
}
```

**Day 5 Commands**:
```bash
cd ~/projects/project-manager-skills

# Update config.json with your GitHub username
# Edit the file to replace YOUR_GITHUB_USERNAME

# Make script executable
chmod +x run_analyzer.py

# Test dry run
./run_analyzer.py --dry-run

# If dry run looks good, run for real
./run_analyzer.py

# Check generated reports
ls -la docs/reports/

# View the latest report
cat docs/reports/analysis-project-manager-test-repo-*.md
```

**Success Metrics for Day 5**:
- [ ] Can run full analysis on test repository
- [ ] Reports are generated correctly
- [ ] Issues are created successfully
- [ ] State is tracked properly (re-run doesn't create duplicates)
- [ ] End-to-end workflow functions without errors

---

### Week 2: Refinement, Production Testing & Documentation

#### Day 6: Error Handling & Robustness

**Tasks**:
1. Add comprehensive error handling
2. Implement retry logic for API calls
3. Add logging system
4. Handle edge cases (empty files, malformed markdown, API rate limits)

**File: `shared/utils.py`**
```python
"""Shared utility functions."""
import logging
import time
from functools import wraps
from typing import Callable, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('project-manager.log'),
        logging.StreamHandler()
    ]
)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance.

    Args:
        name: Logger name

    Returns:
        Logger instance
    """
    return logging.getLogger(name)

def retry_on_failure(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator to retry function on failure.

    Args:
        max_attempts: Maximum number of attempts
        delay: Initial delay between retries (seconds)
        backoff: Multiplier for delay after each retry

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            logger = get_logger(func.__module__)
            current_delay = delay

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        logger.error(f"{func.__name__} failed after {max_attempts} attempts: {e}")
                        raise

                    logger.warning(f"{func.__name__} attempt {attempt} failed: {e}. Retrying in {current_delay}s...")
                    time.sleep(current_delay)
                    current_delay *= backoff

        return wrapper
    return decorator

def safe_file_read(file_path: str, encoding: str = 'utf-8') -> str:
    """Safely read file with fallback encodings.

    Args:
        file_path: Path to file
        encoding: Primary encoding to try

    Returns:
        File contents as string
    """
    encodings = [encoding, 'utf-8', 'latin-1', 'cp1252']

    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, LookupError):
            continue

    # Last resort: read as binary and decode with errors='replace'
    with open(file_path, 'rb') as f:
        return f.read().decode('utf-8', errors='replace')
```

Update key files to use logging and error handling:

**Updated `analyzer/github_client.py`** (add at top):
```python
from shared.utils import get_logger, retry_on_failure

logger = get_logger(__name__)

# Add decorator to methods:
@retry_on_failure(max_attempts=3)
def get_all_issues(self, state: str = "all") -> List[GitHubIssue]:
    logger.info(f"Fetching issues for {self.owner}/{self.repo_name}")
    # ... rest of method
```

**Day 6 Testing**:
```bash
# Test error handling
python -c "
from shared.utils import retry_on_failure, get_logger

logger = get_logger('test')

@retry_on_failure(max_attempts=3, delay=0.5)
def flaky_function():
    import random
    if random.random() < 0.7:
        raise Exception('Random failure')
    return 'Success'

try:
    result = flaky_function()
    print(f'Result: {result}')
except Exception as e:
    print(f'Failed after all retries: {e}')
"

# Check log file
tail -20 project-manager.log
```

**Success Metrics for Day 6**:
- [ ] Logging system captures all operations
- [ ] API calls have retry logic
- [ ] File encoding errors are handled gracefully
- [ ] Rate limits are respected
- [ ] Error messages are clear and actionable

---

#### Day 7: Duplicate Detection & Smart Filtering

**Tasks**:
1. Implement fuzzy matching for duplicate detection
2. Add similarity scoring
3. Filter out already-fixed TODOs
4. Smart grouping of related items

**File: `analyzer/duplicate_detector.py`**
```python
"""Duplicate detection and similarity matching."""
import re
from typing import List, Dict, Tuple
from difflib import SequenceMatcher

class DuplicateDetector:
    """Detects duplicate and similar issues."""

    # Similarity threshold (0.0 to 1.0)
    SIMILARITY_THRESHOLD = 0.75

    def __init__(self):
        """Initialize detector."""
        self.stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was'
        }

    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison.

        Args:
            text: Input text

        Returns:
            Normalized text
        """
        # Convert to lowercase
        text = text.lower()

        # Remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def extract_keywords(self, text: str) -> set:
        """Extract keywords from text.

        Args:
            text: Input text

        Returns:
            Set of keywords
        """
        normalized = self.normalize_text(text)
        words = normalized.split()

        # Remove stopwords and short words
        keywords = {w for w in words if w not in self.stopwords and len(w) > 2}

        return keywords

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0.0 and 1.0
        """
        # Normalize texts
        norm1 = self.normalize_text(text1)
        norm2 = self.normalize_text(text2)

        # Use SequenceMatcher for string similarity
        sequence_similarity = SequenceMatcher(None, norm1, norm2).ratio()

        # Extract keywords
        keywords1 = self.extract_keywords(text1)
        keywords2 = self.extract_keywords(text2)

        # Calculate Jaccard similarity for keywords
        if not keywords1 and not keywords2:
            keyword_similarity = 1.0
        elif not keywords1 or not keywords2:
            keyword_similarity = 0.0
        else:
            intersection = len(keywords1 & keywords2)
            union = len(keywords1 | keywords2)
            keyword_similarity = intersection / union if union > 0 else 0.0

        # Weighted average
        final_similarity = (sequence_similarity * 0.6) + (keyword_similarity * 0.4)

        return final_similarity

    def find_similar_issues(
        self,
        new_item: Dict,
        existing_issues: List[Dict],
        threshold: float = None
    ) -> List[Tuple[Dict, float]]:
        """Find similar issues to a new item.

        Args:
            new_item: New TODO or task item
            existing_issues: List of existing GitHub issues
            threshold: Similarity threshold (uses default if None)

        Returns:
            List of (issue, similarity_score) tuples above threshold
        """
        if threshold is None:
            threshold = self.SIMILARITY_THRESHOLD

        new_text = new_item.get('text', '')
        similar = []

        for issue in existing_issues:
            # Compare with issue title
            title_similarity = self.calculate_similarity(new_text, issue['title'])

            # Compare with issue body
            body_similarity = self.calculate_similarity(new_text, issue['body'])

            # Use the higher similarity
            similarity = max(title_similarity, body_similarity)

            if similarity >= threshold:
                similar.append((issue, similarity))

        # Sort by similarity (descending)
        similar.sort(key=lambda x: x[1], reverse=True)

        return similar

    def is_duplicate(
        self,
        new_item: Dict,
        existing_issues: List[Dict],
        threshold: float = None
    ) -> bool:
        """Check if a new item is a duplicate of existing issues.

        Args:
            new_item: New TODO or task item
            existing_issues: List of existing GitHub issues
            threshold: Similarity threshold (uses default if None)

        Returns:
            True if duplicate found
        """
        similar = self.find_similar_issues(new_item, existing_issues, threshold)
        return len(similar) > 0

    def group_similar_items(
        self,
        items: List[Dict],
        threshold: float = 0.85
    ) -> List[List[Dict]]:
        """Group similar items together.

        Args:
            items: List of items to group
            threshold: Similarity threshold for grouping

        Returns:
            List of groups, where each group is a list of similar items
        """
        groups = []
        processed = set()

        for i, item1 in enumerate(items):
            if i in processed:
                continue

            # Start new group
            group = [item1]
            processed.add(i)

            # Find similar items
            for j, item2 in enumerate(items[i+1:], start=i+1):
                if j in processed:
                    continue

                similarity = self.calculate_similarity(
                    item1.get('text', ''),
                    item2.get('text', '')
                )

                if similarity >= threshold:
                    group.append(item2)
                    processed.add(j)

            groups.append(group)

        return groups
```

**Update `run_analyzer.py`** to include duplicate detection:
```python
from analyzer.duplicate_detector import DuplicateDetector

# After fetching existing issues, add:
duplicate_detector = DuplicateDetector()

# Filter TODOs
filtered_todos = []
for todo in new_todos:
    todo_dict = todo.to_dict()
    if duplicate_detector.is_duplicate(todo_dict, [i.to_dict() for i in existing_issues]):
        print(f"Skipping duplicate TODO: {todo.text[:50]}...")
        state_tracker.mark_todo_processed(todo_dict)  # Mark as processed
    else:
        filtered_todos.append(todo)

# Filter tasks
filtered_tasks = []
for task in new_tasks:
    task_dict = task.to_dict()
    if duplicate_detector.is_duplicate(task_dict, [i.to_dict() for i in existing_issues]):
        print(f"Skipping duplicate task: {task.text[:50]}...")
        state_tracker.mark_task_processed(task_dict)  # Mark as processed
    else:
        filtered_tasks.append(task)

# Use filtered lists for issue creation
new_todos = filtered_todos
new_tasks = filtered_tasks
```

**Day 7 Testing**:
```bash
# Test duplicate detection
python -c "
from analyzer.duplicate_detector import DuplicateDetector

detector = DuplicateDetector()

text1 = 'Implement user authentication system'
text2 = 'Add user login functionality'
text3 = 'Fix bug in payment processing'

print(f'Similarity 1-2: {detector.calculate_similarity(text1, text2):.2f}')
print(f'Similarity 1-3: {detector.calculate_similarity(text1, text3):.2f}')
print(f'Similarity 2-3: {detector.calculate_similarity(text2, text3):.2f}')

# Test grouping
items = [
    {'text': 'Add user login'},
    {'text': 'Implement authentication'},
    {'text': 'Fix payment bug'},
    {'text': 'Add user sign-in'},
]

groups = detector.group_similar_items(items)
print(f'\nGrouped into {len(groups)} groups:')
for i, group in enumerate(groups):
    print(f'Group {i+1}: {[item["text"] for item in group]}')
"
```

**Success Metrics for Day 7**:
- [ ] Duplicate detection prevents redundant issues
- [ ] Similarity scoring is accurate
- [ ] Related items can be grouped
- [ ] False positives are minimal (<10%)
- [ ] Skipped duplicates are logged clearly

---

#### Day 8: Production Repository Testing

**Tasks**:
1. Configure production repositories
2. Run analysis on `codymd-hacknback-main`
3. Run analysis on `care-tracker-mobile`
4. Review and validate created issues
5. Make any necessary adjustments

**Updated `config.json`**:
```json
{
  "repositories": [
    {
      "name": "project-manager-test-repo",
      "owner": "YOUR_GITHUB_USERNAME",
      "planningPaths": ["docs", "memory-bank"],
      "archiveAfterDays": 60
    },
    {
      "name": "codymd-hacknback-main",
      "owner": "YOUR_GITHUB_USERNAME",
      "planningPaths": ["docs", "memory-bank"],
      "archiveAfterDays": 60
    },
    {
      "name": "care-tracker-mobile",
      "owner": "YOUR_GITHUB_USERNAME",
      "planningPaths": ["docs"],
      "archiveAfterDays": 60
    }
  ],
  "github": {
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  },
  "reporting": {
    "schedule": "daily",
    "outputPath": "docs/reports"
  }
}
```

**Day 8 Commands**:
```bash
cd ~/projects/project-manager-skills

# First, dry run to see what would be created
./run_analyzer.py --dry-run

# Review the output carefully
# Check that:
# - File paths are correct
# - TODOs and tasks are parsed correctly
# - No unexpected items

# If everything looks good, run for real
./run_analyzer.py

# Review created issues on GitHub
# Visit: https://github.com/YOUR_USERNAME/codymd-hacknback-main/issues
# Visit: https://github.com/YOUR_USERNAME/care-tracker-mobile/issues

# Check the generated reports
ls -la docs/reports/
cat docs/reports/daily-status-$(date +%Y-%m-%d).md

# Review the state file
cat ~/projects/codymd-hacknback-main/.project-state.json | head -50
```

**Validation Checklist**:
- [ ] All expected TODOs were found
- [ ] Task lists were parsed correctly
- [ ] No duplicate issues were created
- [ ] Labels are applied appropriately
- [ ] Issue descriptions are clear and useful
- [ ] File/line references are accurate
- [ ] State file is updated correctly

**If issues are found**:
1. Document the problem
2. Fix the code
3. Delete test issues on GitHub
4. Clear state file: `rm ~/projects/[repo]/.project-state.json`
5. Re-run

**Success Metrics for Day 8**:
- [ ] Successfully analyzed both production repositories
- [ ] Created issues are high quality
- [ ] No critical bugs encountered
- [ ] Performance is acceptable (< 2 minutes per repo)
- [ ] Users can easily understand created issues

---

#### Day 9: Claude Code Integration & SKILL.md Files

**Tasks**:
1. Create SKILL.md files for Claude Code
2. Write integration instructions
3. Test invocation from Claude Code
4. Document common use cases

**File: `SKILL_ANALYZER.md`** (for Project Analyzer skill)
```markdown
# Project Analyzer Skill

## Description
Analyzes a repository to identify TODOs, task lists, and implementation gaps. This is a read-only skill that gathers intelligence about project state without making any changes.

## When to Use This Skill
- When you need to understand what work is pending in a repository
- To identify forgotten TODOs in the codebase
- To see what tasks are listed in planning documents
- To generate a comprehensive project status report
- Before creating issues to understand what already exists

## How to Invoke

### Basic Analysis
```bash
cd ~/projects/project-manager-skills
./run_analyzer.py --dry-run
```

### Full Analysis with Issue Creation
```bash
cd ~/projects/project-manager-skills
./run_analyzer.py
```

## Outputs
1. **Console Output**: Summary of found items
2. **Analysis Report**: Detailed markdown report in `docs/reports/`
3. **Daily Status Report**: Cross-repository summary
4. **Log File**: Detailed logs in `project-manager.log`

## Configuration
Edit `config.json` to configure:
- Repositories to analyze
- Paths to search for planning documents
- GitHub integration settings
- Report output location

## Requirements
- Python 3.8+
- GitHub personal access token (in `.env`)
- Repository cloned locally

## Limitations
- Only scans configured planning paths
- Does not analyze git history
- Requires local repository access
- GitHub API rate limits apply

## Common Use Cases

### 1. Weekly Project Review
"Analyze all configured repositories and generate a status report"
```bash
./run_analyzer.py
```

### 2. New Repository Onboarding
"Analyze a new repository to understand pending work"
1. Add repository to `config.json`
2. Run `./run_analyzer.py --dry-run` to preview
3. Run `./run_analyzer.py` to create issues

### 3. Sprint Planning
"Identify all high-priority TODOs for sprint planning"
1. Run analyzer
2. Review generated reports
3. Filter issues by priority labels on GitHub
```

**File: `SKILL_MANAGER.md`** (for Project Manager skill)
```markdown
# Project Manager Skill

## Description
Creates and manages GitHub issues based on analysis results. Handles issue creation, labeling, and state tracking to prevent duplicates.

## When to Use This Skill
- After running the Project Analyzer
- To batch-create issues from TODOs and task lists
- To organize backlog items
- To ensure all planning items are tracked

## How to Invoke

The Project Manager is integrated into the analyzer script. It automatically:
1. Creates GitHub issues for new items
2. Applies appropriate labels
3. Tracks processed items in `.project-state.json`
4. Prevents duplicate issue creation

### Manual Issue Creation
```python
from manager.issue_creator import IssueCreator
from shared.config import Config

config = Config()
creator = IssueCreator(
    config.github_token,
    config.github_owner,
    'repository-name',
    config.issue_prefix
)

issue_num = creator.create_issue_from_todo({
    'file_path': 'src/main.py',
    'line_number': 42,
    'text': 'Implement feature X',
    'todo_type': 'TODO'
})
```

## State Management
The manager maintains a `.project-state.json` file in each repository to track:
- Processed TODOs
- Processed tasks
- Created issues
- File checksums

**Never manually edit this file.** To reset state:
```bash
rm /path/to/repo/.project-state.json
```

## Label System
Issues are automatically labeled based on content:

### Category Labels
- `feature`: New functionality
- `bug`: Fixes needed
- `documentation`: Doc improvements
- `refactor`: Code cleanup
- `infrastructure`: DevOps tasks

### Priority Labels
- `priority-high`: Critical items
- `priority-medium`: Important items
- `priority-low`: Nice-to-have items

### Source Labels
- `auto-created`: Automatically created
- `from-todo`: Created from TODO comment
- `from-spec`: Created from task list

## Preventing Duplicates
The manager uses multiple strategies:
1. **State Tracking**: Items are hashed and tracked
2. **Similarity Detection**: Fuzzy matching against existing issues
3. **Idempotency**: Re-running won't create duplicates

## Common Use Cases

### 1. Batch Issue Creation
"Create issues for all TODOs in the codebase"
```bash
./run_analyzer.py
```

### 2. Update Existing Issues
"Update labels and status of existing issues"
(Phase 2 feature - not yet implemented)

### 3. Clean Up State
"Reset state tracking to re-process all items"
```bash
# Backup current state
cp .project-state.json .project-state.backup.json

# Remove state file
rm .project-state.json

# Re-run analysis
./run_analyzer.py
```

## Rollback Procedure
If issues were created incorrectly:

1. **Delete Issues on GitHub**:
   ```bash
   # List recent issues
   gh issue list --limit 50

   # Delete specific issue
   gh issue delete ISSUE_NUMBER
   ```

2. **Reset State**:
   ```bash
   rm /path/to/repo/.project-state.json
   ```

3. **Fix Configuration/Code**

4. **Re-run Analysis**

## Requirements
- GitHub personal access token with `repo` scope
- Write access to target repositories
- Local repository clones

## Limitations
- Cannot update existing issues (Phase 2 feature)
- Cannot close issues (Phase 2 feature)
- No project board integration yet (Phase 3 feature)
```

**Integration with Claude Code**:

Create `CLAUDE_INTEGRATION.md`:
```markdown
# Claude Code Integration Guide

## Overview
These skills can be invoked by Claude Code to automate project management tasks.

## Setup for Claude Code

1. **Install Dependencies**:
   ```bash
   cd ~/projects/project-manager-skills
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure GitHub Access**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GitHub token
   ```

3. **Test Installation**:
   ```bash
   ./run_analyzer.py --dry-run
   ```

## Common Claude Code Workflows

### Workflow 1: Weekly Status Update
**User Prompt**: "Run the project analyzer and summarize the results"

**Claude Code Actions**:
1. Execute: `cd ~/projects/project-manager-skills && ./run_analyzer.py`
2. Read generated reports from `docs/reports/`
3. Summarize key findings:
   - Number of new TODOs found
   - Number of issues created
   - High-priority items
   - Blocked items

### Workflow 2: Pre-Sprint Planning
**User Prompt**: "Analyze my repositories and list all high-priority items"

**Claude Code Actions**:
1. Run analyzer
2. Parse generated reports
3. Filter for `priority-high` labels
4. Present organized list with:
   - Issue numbers
   - Descriptions
   - Estimated complexity
   - Dependencies

### Workflow 3: Repository Onboarding
**User Prompt**: "Add repository X to project management and create initial issues"

**Claude Code Actions**:
1. Edit `config.json` to add new repository
2. Run `./run_analyzer.py --dry-run`
3. Show preview of items to be created
4. Ask for confirmation
5. Run `./run_analyzer.py` to create issues
6. Provide summary with links

## Quick Reference Commands

### Analysis
```bash
# Dry run (preview only)
cd ~/projects/project-manager-skills && ./run_analyzer.py --dry-run

# Full run (create issues)
cd ~/projects/project-manager-skills && ./run_analyzer.py
```

### Reports
```bash
# View latest daily report
cat ~/projects/project-manager-skills/docs/reports/daily-status-$(date +%Y-%m-%d).md

# View latest analysis report
ls -t ~/projects/project-manager-skills/docs/reports/analysis-*.md | head -1 | xargs cat
```

### State Management
```bash
# View state for a repository
cat ~/projects/[REPO_NAME]/.project-state.json | jq '.'

# Count processed items
cat ~/projects/[REPO_NAME]/.project-state.json | jq '.processed_todos | length'
```

### GitHub Integration
```bash
# List recent auto-created issues
gh issue list --label "auto-created" --limit 20

# View issue details
gh issue view ISSUE_NUMBER
```

## Troubleshooting

### Issue: "GITHUB_TOKEN not found"
**Solution**:
```bash
cd ~/projects/project-manager-skills
cp .env.example .env
# Edit .env and add your token
```

### Issue: "Repository path not found"
**Solution**: Update repository paths in `run_analyzer.py` or ensure repositories are cloned to expected locations

### Issue: "Rate limit exceeded"
**Solution**: Wait for rate limit reset or use authenticated requests

## Best Practices

1. **Run Weekly**: Schedule weekly analysis to keep issues up-to-date
2. **Review Before Creating**: Always use `--dry-run` first
3. **Keep State Files**: Don't delete `.project-state.json` unless resetting
4. **Monitor Logs**: Check `project-manager.log` for errors
5. **Update Configuration**: Keep `config.json` in sync with your repositories
```

**Day 9 Testing**:
```bash
# Test that skill files are clear and accurate
# Try following the instructions as a new user would

# Ask Claude Code to invoke the skill
# (This requires Claude Code CLI or web interface)
```

**Success Metrics for Day 9**:
- [ ] SKILL.md files are complete and clear
- [ ] Integration instructions work for new users
- [ ] Common workflows are documented
- [ ] Claude Code can successfully invoke the skills
- [ ] Troubleshooting guide covers common issues

---

#### Day 10: Documentation, Cleanup & Pilot Review

**Tasks**:
1. Write comprehensive README
2. Create user guide
3. Document API/architecture
4. Clean up code
5. Conduct pilot review
6. Plan Phase 2

**File: `README.md`**
```markdown
# Project Manager Skills for Claude Code

Automate project management tasks by analyzing repositories, tracking TODOs, and creating GitHub issues automatically.

## Overview

Two complementary skills:
1. **Project Analyzer**: Scans repositories to identify TODOs and task lists
2. **Project Manager**: Creates GitHub issues and tracks state

## Quick Start

### Prerequisites
- Python 3.8+
- GitHub personal access token
- Git repositories cloned locally

### Installation

1. **Clone or download this project**:
   ```bash
   cd ~/projects
   git clone [YOUR_REPO_URL] project-manager-skills
   cd project-manager-skills
   ```

2. **Install dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure GitHub access**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GitHub personal access token
   ```

4. **Configure repositories**:
   Edit `config.json` and add your repositories:
   ```json
   {
     "repositories": [
       {
         "name": "your-repo-name",
         "owner": "your-github-username",
         "planningPaths": ["docs", "memory-bank"],
         "archiveAfterDays": 60
       }
     ]
   }
   ```

5. **Test the installation**:
   ```bash
   ./run_analyzer.py --dry-run
   ```

### First Run

```bash
# Preview what would be created
./run_analyzer.py --dry-run

# If the preview looks good, run for real
./run_analyzer.py

# Check the generated reports
cat docs/reports/daily-status-$(date +%Y-%m-%d).md
```

## Features

### Phase 1 (Current)
- [x] Scan code files for TODO comments
- [x] Parse markdown task lists
- [x] Create GitHub issues automatically
- [x] Apply smart labels based on content
- [x] Prevent duplicate issue creation
- [x] Generate status reports
- [x] Track processed items

### Phase 2 (Planned)
- [ ] Update existing issues
- [ ] Parse specifications and map to code
- [ ] Calculate implementation percentage
- [ ] Reorganize documentation automatically
- [ ] Link related issues

### Phase 3 (Future)
- [ ] Project board automation
- [ ] Sprint planning assistance
- [ ] Technical debt tracking
- [ ] Cross-repository dependencies

## Usage

### Analyze Repositories
```bash
./run_analyzer.py
```

### Preview Without Creating Issues
```bash
./run_analyzer.py --dry-run
```

### View Reports
```bash
# Daily status
cat docs/reports/daily-status-YYYY-MM-DD.md

# Repository analysis
cat docs/reports/analysis-REPO-NAME-TIMESTAMP.md
```

### Check Logs
```bash
tail -f project-manager.log
```

## Configuration

### config.json
Main configuration file for repositories and settings.

### .env
Environment variables for GitHub authentication:
```
GITHUB_TOKEN=your_personal_access_token
GITHUB_OWNER=your_github_username
```

### .project-state.json
(Generated in each repository)
Tracks processed items to prevent duplicates. Don't edit manually.

## Project Structure

```
project-manager-skills/
├── analyzer/              # Read-only analysis
│   ├── scanner.py        # File system scanning
│   ├── parser.py         # TODO/task parsing
│   ├── github_client.py  # GitHub API (read)
│   ├── reporter.py       # Report generation
│   └── duplicate_detector.py  # Similarity matching
├── manager/              # Write operations
│   ├── issue_creator.py  # Issue creation
│   ├── state_tracker.py  # State management
│   └── label_manager.py  # Label operations
├── shared/               # Shared utilities
│   ├── config.py         # Configuration
│   └── utils.py          # Utilities
├── tests/                # Unit tests
├── run_analyzer.py       # Main script
├── config.json           # Configuration
└── requirements.txt      # Dependencies
```

## Documentation

- `SKILL_ANALYZER.md`: Project Analyzer skill guide
- `SKILL_MANAGER.md`: Project Manager skill guide
- `CLAUDE_INTEGRATION.md`: Claude Code integration
- `ARCHITECTURE.md`: Technical architecture
- `USER_GUIDE.md`: Detailed user guide

## Troubleshooting

See [CLAUDE_INTEGRATION.md](CLAUDE_INTEGRATION.md#troubleshooting) for common issues and solutions.

## Contributing

This is a pilot implementation. Feedback and contributions welcome!

## License

[Your chosen license]

## Acknowledgments

Built for Claude Code to automate project management tasks.
```

**File: `USER_GUIDE.md`**
```markdown
# Project Manager Skills - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Basic Usage](#basic-usage)
5. [Understanding Reports](#understanding-reports)
6. [Working with Issues](#working-with-issues)
7. [State Management](#state-management)
8. [Advanced Topics](#advanced-topics)
9. [Troubleshooting](#troubleshooting)

## Introduction

The Project Manager Skills help you:
- Find forgotten TODOs in your codebase
- Track tasks from planning documents
- Automatically create GitHub issues
- Maintain project status reports
- Prevent duplicate issues

### How It Works

1. **Scan**: Analyzes your repository files
2. **Parse**: Extracts TODOs and task lists
3. **Compare**: Checks against existing GitHub issues
4. **Create**: Makes new issues for untracked items
5. **Track**: Records processed items to prevent duplicates
6. **Report**: Generates status reports

## Installation

[Include installation steps from README]

## Configuration

### GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token"
3. Give it a descriptive name (e.g., "Project Manager Tool")
4. Select scopes:
   - `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)
7. Add to `.env` file:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_OWNER=your_username
   ```

### Repository Configuration

Edit `config.json`:

```json
{
  "repositories": [
    {
      "name": "my-awesome-project",
      "owner": "myusername",
      "planningPaths": ["docs", "memory-bank"],
      "archiveAfterDays": 60
    }
  ],
  "github": {
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  },
  "reporting": {
    "schedule": "daily",
    "outputPath": "docs/reports"
  }
}
```

**Configuration Options**:
- `name`: Repository name on GitHub
- `owner`: GitHub username or organization
- `planningPaths`: Directories to scan for markdown files
- `archiveAfterDays`: (Future) Auto-archive old planning docs
- `issueTitlePrefix`: Prefix for created issues (e.g., "[PM]", "[AUTO]")

## Basic Usage

### First-Time Run

Always start with a dry run to preview results:

```bash
cd ~/projects/project-manager-skills
./run_analyzer.py --dry-run
```

Review the output:
- How many TODOs were found?
- Are the task lists parsed correctly?
- Would any issues be duplicates?

If everything looks good:

```bash
./run_analyzer.py
```

### Regular Use

Run weekly or before sprint planning:

```bash
cd ~/projects/project-manager-skills
./run_analyzer.py
```

The tool will:
1. Find new TODOs and tasks
2. Skip already-processed items
3. Create issues for new items
4. Generate reports

### Understanding Output

```
============================================================
Analyzing repository: my-awesome-project
============================================================

Scanning repository...
Found 45 markdown files
Found 123 code files

Parsing TODOs...
Found 18 TODO comments

Parsing task lists...
Found 12 incomplete tasks

Filtering already processed items...
New TODOs to process: 5
New tasks to process: 3

Fetching existing GitHub issues...
Found 47 existing issues

Creating GitHub issues...
Created label: auto-created
Created issue #123: [PM] Implement user authentication
Created issue #124: [PM] Add password reset functionality
Created issue #125: [PM] Write API documentation

Created 3 issues from TODOs
Created 2 issues from tasks

Report generated: docs/reports/analysis-my-awesome-project-2025-01-15-1420.md

============================================================
Analysis complete!
============================================================
```

## Understanding Reports

### Daily Status Report

Location: `docs/reports/daily-status-YYYY-MM-DD.md`

Example:
```markdown
# Daily Project Status Report

**Date:** 2025-01-15

## Summary
- Repositories Analyzed: 2
- Total TODOs Found: 18
- Total Tasks Found: 12
- Issues Created Today: 5

## By Repository

### my-awesome-project
- TODOs: 18
- Incomplete Tasks: 12
- Issues Created: 5

**Created Issues:**
- #123 (from TODO)
- #124 (from TODO)
- #125 (from task)
```

### Analysis Report

Location: `docs/reports/analysis-REPO-NAME-TIMESTAMP.md`

Contains:
- Summary statistics
- TODOs by file
- Task lists by file
- Created issues with links

Use this report for:
- Sprint planning
- Code reviews
- Technical debt tracking
- Progress monitoring

## Working with Issues

### Issue Format

Created issues include:
- **Title**: Prefixed with `[PM]`, concise description
- **Body**: Source information, context, full description
- **Labels**: Category, priority, and source labels

Example issue:

```markdown
## Source
**Type:** `TODO`
**File:** `src/auth.py`
**Line:** 42

## Context
```
def login(username, password):
    # TODO: Add rate limiting to prevent brute force attacks
    return authenticate(username, password)
```

## Description
Add rate limiting to prevent brute force attacks
```

### Label System

**Category Labels**:
- `feature`: New functionality
- `bug`: Something to fix
- `documentation`: Doc improvements
- `refactor`: Code cleanup
- `infrastructure`: DevOps, build, CI/CD

**Priority Labels**:
- `priority-high`: Critical, urgent
- `priority-medium`: Important
- `priority-low`: Nice to have

**Source Labels**:
- `auto-created`: Made by this tool
- `from-todo`: From code comment
- `from-spec`: From planning doc

### Managing Created Issues

On GitHub, you can:
1. Add assignees
2. Add to milestones
3. Add to projects
4. Update descriptions
5. Close when completed

The tool won't modify issues you've manually edited.

## State Management

### .project-state.json

Each repository gets a `.project-state.json` file tracking:
- Processed TODOs
- Processed tasks
- Created issues
- File checksums

**Example**:
```json
{
  "version": "1.0",
  "last_updated": "2025-01-15T14:30:00",
  "processed_todos": {
    "hash1": {
      "file_path": "src/auth.py",
      "line_number": 42,
      "text": "Add rate limiting",
      "processed_at": "2025-01-15T14:30:00",
      "issue_number": 123
    }
  },
  "created_issues": [...]
}
```

### When to Reset State

Reset if:
- You want to re-process all items
- State file got corrupted
- You deleted issues and want to recreate

**How to reset**:
```bash
# Backup first (optional)
cp /path/to/repo/.project-state.json backup-state.json

# Delete state
rm /path/to/repo/.project-state.json

# Re-run analysis
cd ~/projects/project-manager-skills
./run_analyzer.py
```

**Warning**: This will create issues for ALL items, even if they already have issues.

## Advanced Topics

### Custom Label Logic

Edit `manager/label_manager.py` to customize how labels are applied:

```python
def categorize_todo(self, todo_text: str, todo_type: str) -> List[str]:
    labels = ['auto-created', 'from-todo']

    # Your custom logic here
    if 'urgent' in todo_text.lower():
        labels.append('priority-high')

    return labels
```

### Adjusting Duplicate Detection

Edit `analyzer/duplicate_detector.py`:

```python
# Change similarity threshold
SIMILARITY_THRESHOLD = 0.75  # 0.0 to 1.0
```

Lower threshold = more strict (fewer duplicates detected)
Higher threshold = more lenient (more duplicates detected)

### Filtering Specific Directories

Edit `analyzer/scanner.py`:

```python
SKIP_DIRS = {
    '.git', 'node_modules', 'venv',
    'your_custom_dir_to_skip'  # Add here
}
```

## Troubleshooting

### "GITHUB_TOKEN not found"

**Cause**: `.env` file missing or incorrectly formatted

**Solution**:
```bash
cd ~/projects/project-manager-skills
cp .env.example .env
# Edit .env and add your token
```

### "Repository path not found"

**Cause**: Repository not cloned or wrong path

**Solution**:
Update the path in `run_analyzer.py`:
```python
repo_path = Path.home() / 'projects' / repo_name  # Adjust this line
```

### Rate limit exceeded

**Cause**: Too many GitHub API requests

**Solution**:
- Wait for rate limit reset (check: `gh api rate_limit`)
- Reduce number of repositories analyzed at once
- Ensure you're using authenticated requests (token in `.env`)

### Duplicate issues created

**Cause**: State file deleted or moved

**Solution**:
1. Delete duplicate issues on GitHub
2. Ensure `.project-state.json` stays in repository root
3. Don't run tool from multiple locations simultaneously

### Issues not created

**Cause**: Several possibilities

**Check**:
1. GitHub token has `repo` scope
2. Token hasn't expired
3. Repository names match exactly (case-sensitive)
4. Owner name is correct
5. Check `project-manager.log` for errors

### Wrong labels applied

**Cause**: Label detection logic

**Solution**:
- Review logic in `manager/label_manager.py`
- Add keywords for your specific domain
- Submit feedback for improvements

### Performance issues

**Cause**: Large repositories

**Solution**:
- Scan specific directories only (use `planningPaths`)
- Skip large directories (add to `SKIP_DIRS`)
- Process repositories one at a time

## Best Practices

1. **Run regularly**: Weekly analysis keeps issues current
2. **Review before running**: Use `--dry-run` first
3. **Monitor logs**: Check for errors
4. **Back up state**: Keep `.project-state.json` safe
5. **Refine configuration**: Adjust paths and settings as needed
6. **Clean up TODOs**: Fix TODOs and remove them from code
7. **Update planning docs**: Mark tasks complete when done

## Getting Help

- Check log file: `tail -f project-manager.log`
- Review generated reports
- Check GitHub issues for the tool itself
- Contact [your support channel]

## Next Steps

After the pilot:
- Phase 2: Advanced features
- Phase 3: Dashboard and automation
- Integration with CI/CD
- Custom workflows
```

**Final Day 10 Tasks**:

1. **Code cleanup**:
```bash
cd ~/projects/project-manager-skills

# Format code
black .

# Check style
flake8 . --max-line-length=100

# Run all tests
pytest tests/ -v

# Check test coverage
pytest --cov=. --cov-report=html
```

2. **Create ARCHITECTURE.md** (document technical decisions)

3. **Pilot review meeting**:
   - Demonstrate the tool
   - Show created issues
   - Review reports
   - Gather feedback
   - Document lessons learned

4. **Plan Phase 2**:
   - Prioritize features based on pilot feedback
   - Identify pain points
   - Document Phase 2 requirements

**Success Metrics for Day 10**:
- [ ] All documentation is complete
- [ ] Code is clean and well-formatted
- [ ] All tests pass
- [ ] Pilot review conducted
- [ ] Phase 2 roadmap created

---

## Testing Strategy

### Unit Tests

**Coverage targets**:
- Scanner: 90%+
- Parser: 95%+
- State Tracker: 95%+
- GitHub Client: 80%+ (mocked)
- Issue Creator: 80%+ (mocked)

**Test categories**:
1. **Happy path**: Normal operation
2. **Edge cases**: Empty files, malformed content
3. **Error handling**: Network errors, API failures
4. **Integration**: End-to-end workflows

### Integration Tests

Test scenarios:
1. **New repository**: First-time analysis
2. **Incremental update**: Re-running after changes
3. **No changes**: Re-running without new items
4. **Mixed content**: TODOs and tasks together
5. **Large repository**: Performance testing

### Manual Testing Checklist

**Pre-deployment**:
- [ ] Test with empty repository
- [ ] Test with repository containing only TODOs
- [ ] Test with repository containing only tasks
- [ ] Test with repository containing both
- [ ] Test with repository that has existing issues
- [ ] Test duplicate detection
- [ ] Test state persistence
- [ ] Test report generation
- [ ] Test with invalid GitHub token
- [ ] Test with nonexistent repository
- [ ] Test with rate-limited API
- [ ] Test performance with large repository (1000+ files)

**Post-deployment** (production repositories):
- [ ] Verify created issues are correct
- [ ] Verify no duplicates
- [ ] Verify labels are appropriate
- [ ] Verify file/line references are accurate
- [ ] Verify reports are readable
- [ ] Verify state file is created
- [ ] Verify re-running doesn't create duplicates

---

## Risk Assessment & Mitigation

### High-Priority Risks

#### Risk 1: Duplicate Issue Creation
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Robust state tracking with SHA256 hashing
- Fuzzy string matching for similarity
- Pre-flight checks before creating issues
- State file backup before operations
**Rollback**: Delete duplicate issues, reset state, fix code, re-run

#### Risk 2: GitHub API Rate Limiting
**Impact**: Medium
**Likelihood**: Medium
**Mitigation**:
- Use authenticated requests (higher limits)
- Implement exponential backoff
- Batch operations where possible
- Monitor rate limit status
**Rollback**: Wait for rate limit reset, reduce frequency

#### Risk 3: Incorrect Issue Categorization
**Impact**: Low
**Likelihood**: High
**Mitigation**:
- Conservative defaults
- User review of dry-run output
- Easy label editing on GitHub
- Iterative improvement based on feedback
**Rollback**: Manually re-label issues on GitHub

### Medium-Priority Risks

#### Risk 4: State File Corruption
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- JSON validation on load
- Atomic writes
- Regular backups
- Graceful degradation (recreate if corrupted)
**Rollback**: Restore from backup

#### Risk 5: Performance Issues with Large Repositories
**Impact**: Low
**Likelihood**: Medium
**Mitigation**:
- Scan only configured paths
- Skip irrelevant directories
- Process files in batches
- Add progress indicators
**Rollback**: Reduce scope, process fewer repositories at once

### Low-Priority Risks

#### Risk 6: Parsing Errors
**Impact**: Low
**Likelihood**: Low
**Mitigation**:
- Comprehensive regex patterns
- Error handling for malformed content
- Logging of parsing failures
- Continue on error (don't crash)
**Rollback**: Fix parsing logic, re-run

---

## Success Metrics

### Quantitative Metrics

1. **TODO Reduction**: 90%+ of TODOs tracked as issues
   - Baseline: Count of TODOs before pilot
   - Target: <10 untracked TODOs after pilot

2. **Zero Duplicates**: 0 duplicate issues created
   - Measure: Manual review of created issues
   - Target: 100% unique issues

3. **Time Savings**: 30-45 minutes saved daily
   - Baseline: Time to manually create issues
   - Target: <5 minutes to run tool + review

4. **Issue Quality**: 90%+ of issues require no manual edits
   - Measure: % of issues used as-is
   - Target: Minimal post-creation editing

5. **Processing Speed**: <2 minutes per repository
   - Measure: Execution time logged
   - Target: Fast enough for daily use

### Qualitative Metrics

1. **User Satisfaction**: Positive feedback from pilot users
2. **Adoption**: Regular use (weekly or more)
3. **Issue Clarity**: Issues are actionable and clear
4. **Report Usefulness**: Reports inform decisions
5. **Maintainability**: Code is easy to update and extend

### Tracking

Create `metrics.md` to track progress:

```markdown
# Pilot Metrics Tracking

## Week 1

### Repository: project-manager-test-repo
- TODOs found: 3
- Tasks found: 4
- Issues created: 7
- Duplicates: 0
- Execution time: 12 seconds
- User feedback: "Works well, labels are accurate"

## Week 2

### Repository: codymd-hacknback-main
- TODOs found: 24
- Tasks found: 18
- Issues created: 42
- Duplicates: 0
- Execution time: 1m 23s
- User feedback: "Found TODOs I forgot about!"

### Repository: care-tracker-mobile
- TODOs found: 15
- Tasks found: 12
- Issues created: 27
- Duplicates: 0
- Execution time: 47s
- User feedback: "Very helpful for sprint planning"

## Summary
- Total TODOs tracked: 42
- Total tasks tracked: 34
- Total issues created: 76
- Duplicate rate: 0%
- Average execution time: 54 seconds
- Time saved per week: ~2.5 hours (estimate)
```

---

## Rollback Plan

### When to Rollback

Rollback if:
1. Critical bugs prevent normal operation
2. High volume of duplicate issues created
3. Data corruption or loss
4. GitHub API abuse (rate limit violations)
5. User feedback is overwhelmingly negative

### Rollback Procedure

#### Step 1: Stop Operations
```bash
# Don't run the tool until issues are resolved
# If running via cron, disable it
crontab -e  # Comment out the job
```

#### Step 2: Assess Damage
```bash
# List recently created issues
gh issue list --label "auto-created" --limit 100

# Check state files
find ~/projects -name ".project-state.json" -exec cat {} \;

# Review logs
tail -100 ~/projects/project-manager-skills/project-manager.log
```

#### Step 3: Clean Up Issues (if necessary)
```bash
# If many duplicates were created, bulk delete
cd ~/projects/PROJECT_NAME

# List issues to delete
gh issue list --label "auto-created" --json number,title --limit 100

# Delete specific issues
for issue_num in $(gh issue list --label "auto-created" --json number --jq '.[].number' --limit 100); do
  gh issue delete $issue_num --yes
done
```

#### Step 4: Reset State
```bash
# Backup existing state
find ~/projects -name ".project-state.json" -exec cp {} {}.backup \;

# Remove state files
find ~/projects -name ".project-state.json" -delete
```

#### Step 5: Fix the Code
- Identify root cause
- Implement fix
- Add tests for the bug
- Test thoroughly on test repository

#### Step 6: Re-deploy
```bash
cd ~/projects/project-manager-skills

# Run tests
pytest tests/ -v

# Test on test repository
./run_analyzer.py --dry-run

# If good, run for real on test repo
./run_analyzer.py

# Monitor closely
tail -f project-manager.log
```

#### Step 7: Communicate
- Inform users of the issue
- Explain what was fixed
- Provide instructions for next steps

---

## Phase 2 Planning (Week 3-4)

### Scope for Phase 2

Based on pilot feedback, prioritize:

1. **Update Existing Issues** (High Priority)
   - Detect when TODOs are fixed
   - Close corresponding issues automatically
   - Add comments with resolution details

2. **Specification Mapping** (High Priority)
   - Parse requirements from planning docs
   - Map to actual code implementations
   - Identify partially implemented features
   - Calculate implementation percentage

3. **Issue Linking** (Medium Priority)
   - Link related issues
   - Group similar items
   - Create epic/parent issues

4. **Documentation Reorganization** (Low Priority)
   - Move old planning docs to archive
   - Organize by date and project
   - Create index of archived docs

### Phase 2 Implementation Plan

**Week 3**:
- Day 11: Design specification parser
- Day 12: Implement spec-to-code mapping
- Day 13: Build implementation tracker
- Day 14: Add issue update logic
- Day 15: Test and refine

**Week 4**:
- Day 16: Implement issue linking
- Day 17: Build documentation organizer
- Day 18: End-to-end integration
- Day 19: Production testing
- Day 20: Review and document

---

## Appendices

### Appendix A: Configuration Reference

Complete `config.json` schema:

```json
{
  "repositories": [
    {
      "name": "string (required)",
      "owner": "string (required)",
      "planningPaths": ["array of strings (optional, default: ['docs'])"],
      "archiveAfterDays": "number (optional, default: 60)",
      "excludePaths": ["array of strings (optional)"],
      "customLabels": {
        "category": "string (optional)",
        "priority": "string (optional)"
      }
    }
  ],
  "github": {
    "defaultLabels": ["array of strings"],
    "issueTitlePrefix": "string",
    "maxIssuesPerRun": "number (optional, default: 100)"
  },
  "reporting": {
    "schedule": "string (daily|weekly|monthly)",
    "outputPath": "string",
    "format": "string (markdown|html|json)"
  },
  "parsing": {
    "todoPatterns": ["array of regex strings (optional)"],
    "taskPatterns": ["array of regex strings (optional)"]
  },
  "filtering": {
    "similarityThreshold": "number (0.0-1.0, optional, default: 0.75)",
    "skipCompleted": "boolean (optional, default: true)",
    "minTodoLength": "number (optional, default: 10)"
  }
}
```

### Appendix B: API Reference

Key classes and methods:

#### FileScanner
```python
scanner = FileScanner(repo_path)
markdown_files = scanner.find_markdown_files(search_paths)
code_files = scanner.find_code_files()
relative_path = scanner.get_relative_path(file_path)
```

#### TodoParser
```python
parser = TodoParser()
todos = parser.parse_file(file_path, relative_path)
# Returns List[TodoItem]
```

#### TaskListParser
```python
parser = TaskListParser()
tasks = parser.parse_file(file_path, relative_path)
# Returns List[TaskItem]
```

#### GitHubClient
```python
client = GitHubClient(token, owner, repo_name)
issues = client.get_all_issues(state='all')
labels = client.get_repository_labels()
results = client.search_issues_by_keyword(keyword)
```

#### StateTracker
```python
tracker = StateTracker(repo_path)
is_processed = tracker.is_todo_processed(todo_dict)
tracker.mark_todo_processed(todo_dict, issue_number)
tracker.save_state()
```

#### IssueCreator
```python
creator = IssueCreator(token, owner, repo_name, title_prefix)
issue_num = creator.create_issue_from_todo(todo_dict, labels)
issue_num = creator.create_issue_from_task(task_dict, labels)
results = creator.create_issues_batch(todos, tasks)
```

### Appendix C: GitHub CLI Quick Reference

Useful `gh` commands:

```bash
# List issues
gh issue list
gh issue list --label "priority-high"
gh issue list --state open
gh issue list --assignee @me

# View issue
gh issue view 123
gh issue view 123 --web

# Create issue
gh issue create --title "Title" --body "Body"

# Update issue
gh issue edit 123 --add-label "bug"
gh issue edit 123 --add-assignee username

# Close issue
gh issue close 123

# Delete issue
gh issue delete 123

# Check rate limit
gh api rate_limit
```

### Appendix D: Troubleshooting Decision Tree

```
Issue occurred
├─ Can't authenticate to GitHub
│  ├─ Check GITHUB_TOKEN in .env
│  ├─ Verify token hasn't expired
│  └─ Ensure token has 'repo' scope
│
├─ Duplicates created
│  ├─ Check .project-state.json exists
│  ├─ Verify state file not corrupted
│  └─ Review similarity threshold
│
├─ Missing TODOs/tasks
│  ├─ Check file extensions scanned
│  ├─ Verify paths in config
│  └─ Review SKIP_DIRS list
│
├─ Wrong labels applied
│  ├─ Review label logic in label_manager.py
│  ├─ Check keyword matching
│  └─ Manually update on GitHub
│
├─ Performance issues
│  ├─ Limit planningPaths
│  ├─ Add directories to SKIP_DIRS
│  └─ Process fewer repositories
│
└─ Other error
   ├─ Check project-manager.log
   ├─ Run with --dry-run
   └─ Test on small repository
```

---

## Conclusion

This pilot implementation plan provides:
- **Detailed week-by-week breakdown** for 2-week MVP
- **Complete code examples** for all core modules
- **Testing strategy** with unit and integration tests
- **Risk mitigation** for potential issues
- **Clear success metrics** to measure impact
- **Rollback procedures** if problems occur
- **Integration guide** for Claude Code
- **Comprehensive documentation** for users

The plan emphasizes:
1. **Safety**: Test repository first, dry-run mode, state tracking
2. **Quality**: Unit tests, error handling, logging
3. **Usability**: Clear documentation, helpful error messages
4. **Maintainability**: Clean code, modular design, good practices

Following this plan will result in a working MVP that:
- Reduces manual project management overhead
- Ensures all work items are tracked
- Prevents duplicate issues
- Provides actionable insights
- Scales to multiple repositories

**Next Steps**: Begin Day 1 implementation immediately!
