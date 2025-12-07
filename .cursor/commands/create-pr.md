# TASK: Create Pull Request

Generate a comprehensive Pull Request description based on the current branch's changes and create the PR using GitHub CLI, following professional PR template format.

# CONTEXT: PROJECT INFORMATION

- **Project:** Kinetic Visual Synthesizer (KVS) - A browser-based, GPGPU-accelerated particle system
- **Architecture:** GPGPU Physics Engine, Web Workers for Computer Vision, Svelte + Threlte
- **Tech Stack:** Svelte 5, TypeScript, Threlte 7+, WebGL/GLSL, MediaPipe, Vite
- **Branch Naming:** Feature-based (e.g., `simulation-canvas`, `feature/particle-system`, `fix/gpgpu-memory-leak`)
- **Commit Style:** Semantic commits (feat, fix, refactor, chore, docs, perf, test)
- **Base Branch:** Typically `main`, but may branch from feature branches

# STEP 1: GATHER GIT INFORMATION

First, collect the following information from git:

1. **Current Branch Name:**

   ```bash
   git branch --show-current
   ```

2. **Detect Base Branch:**
   The base branch is the branch that the current branch was created from. This may not always be `main`. To detect it:

   **Recommended method** (most accurate):

   ```bash
   CURRENT_BRANCH=$(git branch --show-current)

   # Get the first commit on current branch that's not in main
   FIRST_COMMIT=$(git log --oneline --reverse ${CURRENT_BRANCH} --not main | head -1 | cut -d' ' -f1)

   if [ -n "$FIRST_COMMIT" ]; then
     # Get the parent of the first commit (this is where the branch was created from)
     PARENT_COMMIT=$(git rev-parse "${FIRST_COMMIT}^" 2>/dev/null || echo "")

     if [ -n "$PARENT_COMMIT" ]; then
       # Find which branch(es) contain this parent commit (excluding current branch)
       BASE_BRANCH=$(git branch --contains $PARENT_COMMIT --all 2>/dev/null | \
         grep -v "$CURRENT_BRANCH" | \
         grep -v "HEAD" | \
         grep -v "remotes/origin/HEAD" | \
         grep -E "(main|master|develop|feature|fix)" | \
         head -1 | \
         sed 's/^[ *]*//' | \
         sed 's/^remotes\/origin\///')
     fi
   fi

   # Fallback to main if detection failed
   BASE_BRANCH=${BASE_BRANCH:-main}
   echo $BASE_BRANCH
   ```

   **Alternative method** (simpler, but may be less accurate):

   ```bash
   CURRENT_BRANCH=$(git branch --show-current)
   MERGE_BASE=$(git merge-base HEAD main)

   # Find branches that contain the merge-base (excluding current branch)
   BASE_BRANCH=$(git branch --contains $MERGE_BASE --all 2>/dev/null | \
     grep -v "$CURRENT_BRANCH" | \
     grep -v "HEAD" | \
     grep -v "remotes/origin/HEAD" | \
     grep -E "(main|master|develop)" | \
     head -1 | \
     sed 's/^[ *]*//' | \
     sed 's/^remotes\/origin\///')

   # Default to main if not found
   BASE_BRANCH=${BASE_BRANCH:-main}
   echo $BASE_BRANCH
   ```

   **Note:** Store the detected base branch in a variable `BASE_BRANCH` for use in subsequent commands. The recommended method is more accurate as it finds the exact point where the branch diverged.

3. **Files Changed:**

   ```bash
   # Use detected BASE_BRANCH instead of hardcoded main
   git diff --name-status origin/${BASE_BRANCH}...HEAD 2>/dev/null || git diff --name-status HEAD~1..HEAD
   ```

4. **Commit Messages:**

   ```bash
   # Use detected BASE_BRANCH instead of hardcoded main
   git log origin/${BASE_BRANCH}..HEAD --oneline 2>/dev/null || git log --oneline -10
   ```

5. **Diff Summary:**

   ```bash
   # Use detected BASE_BRANCH instead of hardcoded main
   git diff --stat origin/${BASE_BRANCH}...HEAD 2>/dev/null || git diff --stat HEAD~1..HEAD
   ```

6. **Uncommitted Changes:**

   ```bash
   git status --short
   ```

7. **Check if Branch is Pushed:**

   ```bash
   git status
   git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | head -1
   ```

8. **Verify GitHub CLI is Available:**

   ```bash
   which gh
   ```

9. **Get Remote Repository Info:**
   ```bash
   git remote -v
   ```

# STEP 2: ANALYZE CHANGES

Analyze the collected information to determine:

1. **Type of Change:**
   - **Bug fix:** Look for keywords: "fix", "bug", "error", "issue", "broken", "null", "crash"
   - **New feature:** Look for keywords: "add", "implement", "feature", "new", "feat"
   - **Performance:** Look for keywords: "perf", "optimize", "performance", "speed", "fps"
   - **Refactor:** Look for keywords: "refactor", "restructure", "cleanup", "reorganize"
   - **Breaking change:** Look for keywords: "breaking", "remove", "deprecate", "migrate", or major refactoring
   - **Documentation:** Only `.md` files changed, or commits mentioning "docs", "readme", "documentation"
   - **Test:** Only test files changed, or commits mentioning "test", "spec"

2. **Files Changed Categories:**
   - **Shader files:** `*.glsl`, `**/shaders/**`
   - **GPGPU:** `**/gpgpu/**`, `**/hooks/useGPGPU.ts`
   - **Computer Vision:** `**/vision/**`, MediaPipe-related files
   - **Components:** `**/components/**/*.svelte`
   - **Stores:** `**/stores/**`
   - **Utils:** `**/utils/**`
   - **Tests:** `**/*.test.ts`, `**/test/**`
   - **Configuration:** `*.config.*`, `package.json`, `tsconfig.json`, etc.

3. **Architecture Impact:**
   - **GPGPU changes:** Check if FBO ping-pong logic, shader uniforms, or texture management changed
   - **Worker changes:** Check if Web Worker logic or MediaPipe integration changed
   - **Reactive bridge:** Check if store-to-uniform communication changed
   - **Performance:** Check if zero-garbage principles were maintained

4. **Dependencies:**
   - Check if `package.json` or `yarn.lock` changed
   - Check if shader files changed (may require rebuild)
   - Check if other PRs are referenced in commit messages

5. **Testing:**
   - Check if test files were added/modified
   - Check if manual testing is required (GPGPU, Web Workers, WebGL)

# STEP 3: GENERATE PR DESCRIPTION

Generate a PR description following this template structure:

```markdown
## Description

<!-- Generate a clear, concise summary of what this PR does. Include:
- What problem it solves or what feature it adds
- Key technical decisions or approaches
- Any relevant context about why this change was needed
- Reference GPGPU, Web Workers, or architecture components if relevant
-->

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Performance improvement (optimization without changing functionality)
- [ ] Refactor (code restructuring without changing functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Test addition/update

## Architecture Impact

<!-- Analyze and list:
- GPGPU changes (FBO, shaders, uniforms)
- Web Worker changes (MediaPipe, computer vision)
- Reactive bridge changes (stores, uniforms)
- Performance implications
- Zero-garbage compliance
- If none, state "No architectural changes"
-->

## Dependencies

<!-- Analyze and list:
- Package updates? (check package.json changes)
- Shader changes? (may require rebuild)
- Other PRs this depends on? (from commit messages)
- If none, state "No changes"
-->

## How should this be manually tested?

<!-- Generate step-by-step testing instructions based on:
- What features/components were added/modified
- What user flows are affected
- What edge cases should be tested
- Include specific test data or scenarios if relevant
- For GPGPU/WebGL: mention browser requirements, performance expectations
- For Web Workers: mention camera permissions, hand tracking
-->

1. ...
2. ...
3. ...

## Performance Considerations

<!-- For GPGPU, Web Workers, or performance-related changes:
- Expected FPS impact
- Memory usage changes
- Particle count scalability
- Browser compatibility notes
-->

## Screenshots / Visual Changes

<!-- If UI or visual changes were made, mention that screenshots should be added -->

## Highlights to Review

<!-- Call out specific areas for reviewers:
- GPGPU implementation details (FBO ping-pong, shader logic)
- Web Worker communication patterns
- Reactive bridge (store-to-uniform updates)
- Complex math or shader algorithms
- Performance-critical sections
- Areas where you want specific feedback
-->

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works (if applicable)
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have verified zero-garbage principles (no allocations in render loops)
- [ ] I have verified GPGPU/Web Worker separation of concerns
- [ ] Performance targets are met (60 FPS, <50ms latency)

## Deployment Notes

<!-- Mention any:
- Environment variable changes needed
- Build configuration changes
- Browser compatibility requirements
- Post-deployment steps
- Rollback considerations
-->
```

# STEP 4: INTELLIGENT DEFAULTS

Apply these intelligent defaults based on analysis:

1. **Type of Change:**
   - Auto-check the appropriate box based on commit messages and file changes
   - If unclear, default to "New feature"

2. **Description:**
   - Summarize commits in a clear, user-friendly way
   - Focus on "what" and "why", not just "how"
   - Reference GPGPU, Web Workers, or architecture components if relevant
   - Mention key technical decisions (e.g., "Uses Velocity Verlet integration", "Implements curl noise")

3. **Architecture Impact:**
   - If shader files changed: "Shader updates in `simulation/` or `rendering/`"
   - If GPGPU files changed: "FBO ping-pong logic or texture management"
   - If vision files changed: "Web Worker or MediaPipe integration"
   - If stores changed: "Reactive bridge (store-to-uniform communication)"
   - If none: "No architectural changes"

4. **Dependencies:**
   - If package.json changed: List key package updates
   - If shader files changed: "Shader changes require rebuild"
   - If no dependencies: "No changes"

5. **Manual Testing:**
   - Generate specific, actionable steps
   - Reference actual components/features changed
   - Include edge cases if relevant
   - For GPGPU: Mention browser requirements (WebGL2), particle count testing
   - For Web Workers: Mention camera permissions, hand tracking scenarios
   - Make it clear enough for external testers

6. **Performance Considerations:**
   - Only add if GPGPU, Web Workers, or performance-related changes
   - Mention FPS expectations, memory usage, scalability
   - Reference browser compatibility if relevant

7. **Highlights to Review:**
   - Mention GPGPU implementation details if shaders/FBO changed
   - Call out Web Worker communication patterns if vision code changed
   - Note reactive bridge changes if stores/uniforms changed
   - Call out complex math or shader algorithms
   - Note any performance-critical sections

8. **Deployment Notes:**
   - Only add if there are environment variables, config changes, or special considerations
   - Otherwise, can be omitted or say "No special deployment considerations"

# STEP 5: GENERATE PR TITLE

Generate a PR title based on the branch name and commit messages:

1. **Extract Semantic Prefix:** From commit messages, identify the most common type:

   ```bash
   CURRENT_BRANCH=$(git branch --show-current)
   COMMIT_TYPES=$(git log origin/${BASE_BRANCH}..HEAD --oneline 2>/dev/null | \
     grep -oE '^(feat|fix|perf|refactor|chore|docs|test|breaking)' | \
     head -1)
   ```

2. **Generate Title from Branch Name:**

   ```bash
   # Convert branch name to Title Case
   # Remove common prefixes (feature/, fix/, etc.)
   DESCRIPTION=$(echo ${CURRENT_BRANCH} | \
     sed 's/^feature\///' | \
     sed 's/^fix\///' | \
     sed 's/^perf\///' | \
     sed 's/^refactor\///' | \
     sed 's/-/ /g' | \
     sed 's/\b\(.\)/\u\1/g')

   # If we have a commit type, prefix it
   if [ -n "$COMMIT_TYPES" ]; then
     PR_TITLE="${COMMIT_TYPES}: ${DESCRIPTION}"
   else
     PR_TITLE="${DESCRIPTION}"
   fi
   ```

   Examples:
   - `simulation-canvas` → `feat: Simulation Canvas`
   - `fix/gpgpu-memory-leak` → `fix: GPGPU Memory Leak`
   - `perf/particle-rendering` → `perf: Particle Rendering`
   - `feature/curl-noise` → `feat: Curl Noise`

3. **Alternative: Use First Commit Message:**
   If branch name is unclear, use the first commit message:
   ```bash
   FIRST_COMMIT_MSG=$(git log origin/${BASE_BRANCH}..HEAD --oneline --reverse 2>/dev/null | head -1 | cut -d' ' -f2-)
   if [ -n "$FIRST_COMMIT_MSG" ]; then
     PR_TITLE="${FIRST_COMMIT_MSG}"
   fi
   ```

# STEP 6: CHECK FOR EXISTING PR

Before creating a new PR, check if one already exists for this branch:

```bash
gh pr list --head $(git branch --show-current) --json number,title,url,state
```

**Handle Results:**

- If PR exists: Inform user with PR details and exit (don't create duplicate)
- If no PR exists: Proceed to create new PR

# STEP 7: CREATE PULL REQUEST

After generating the PR description, create the PR using GitHub CLI:

1. **Verify Prerequisites:**
   - GitHub CLI (`gh`) is installed and authenticated
   - Branch is pushed to remote
   - Working directory is clean (or only has untracked files that don't affect the PR)
   - No existing PR for this branch

2. **Create PR Command:**

   When using the tool, pass the body directly as a string argument. The PR description should be properly formatted with all markdown sections:

   **IMPORTANT:** Use the detected `BASE_BRANCH` from Step 1, not hardcoded `main`:

   ```bash
   # Use the BASE_BRANCH variable detected in Step 1
   # Generate PR title
   CURRENT_BRANCH=$(git branch --show-current)
   COMMIT_TYPES=$(git log origin/${BASE_BRANCH}..HEAD --oneline 2>/dev/null | \
     grep -oE '^(feat|fix|perf|refactor|chore|docs|test|breaking)' | \
     head -1)

   DESCRIPTION=$(echo ${CURRENT_BRANCH} | \
     sed 's/^feature\///' | \
     sed 's/^fix\///' | \
     sed 's/^perf\///' | \
     sed 's/^refactor\///' | \
     sed 's/-/ /g' | \
     sed 's/\b\(.\)/\u\1/g')

   if [ -n "$COMMIT_TYPES" ]; then
     PR_TITLE="${COMMIT_TYPES}: ${DESCRIPTION}"
   else
     PR_TITLE="${DESCRIPTION}"
   fi

   gh pr create \
     --base ${BASE_BRANCH} \
     --title "${PR_TITLE}" \
     --body "<!-- Generated PR description with all sections -->"
   ```

   **Note:** If the base branch detection failed or returned empty, default to `main`:

   ```bash
   BASE_BRANCH=${BASE_BRANCH:-main}
   CURRENT_BRANCH=$(git branch --show-current)
   COMMIT_TYPES=$(git log origin/${BASE_BRANCH}..HEAD --oneline 2>/dev/null | \
     grep -oE '^(feat|fix|perf|refactor|chore|docs|test|breaking)' | \
     head -1)

   DESCRIPTION=$(echo ${CURRENT_BRANCH} | \
     sed 's/^feature\///' | \
     sed 's/^fix\///' | \
     sed 's/^perf\///' | \
     sed 's/^refactor\///' | \
     sed 's/-/ /g' | \
     sed 's/\b\(.\)/\u\1/g')

   if [ -n "$COMMIT_TYPES" ]; then
     PR_TITLE="${COMMIT_TYPES}: ${DESCRIPTION}"
   else
     PR_TITLE="${DESCRIPTION}"
   fi

   gh pr create \
     --base ${BASE_BRANCH} \
     --title "${PR_TITLE}" \
     --body "<!-- Generated PR description with all sections -->"
   ```

3. **Verify PR Creation:**

   ```bash
   gh pr view <PR_NUMBER> --json number,title,state,url
   ```

4. **Handle Edge Cases:**
   - If PR already exists: Inform the user and provide the PR URL (skip creation)
   - If branch is not pushed: Prompt to push first with `git push -u origin <branch-name>`
   - If GitHub CLI is not available: Output the description for manual creation
   - If PR creation fails: Show error message and provide description for manual creation

# STEP 8: OUTPUT FORMAT

After creating the PR, output:

1. **PR Creation Status:** Success or failure
2. **PR Details:**
   - PR number
   - PR title
   - PR URL
   - PR state (OPEN, DRAFT, etc.)
3. **Next Steps:** Any follow-up actions needed

# RULES

1. **Accuracy:** Only include information you can verify from git commands
2. **Completeness:** Fill in all sections, even if brief
3. **Clarity:** Write for both technical and non-technical reviewers
4. **Conciseness:** Be thorough but not verbose
5. **Architecture Awareness:** Reference GPGPU, Web Workers, and reactive bridge when relevant
6. **Performance Focus:** Emphasize performance considerations for GPGPU/WebGL changes
7. **Automation:** Always attempt to create the PR automatically using GitHub CLI
8. **Error Handling:** If PR creation fails, provide the description for manual creation
9. **Verification:** Always verify PR was created successfully before completing
10. **Base Branch Detection:** **CRITICAL** - Always detect the actual base branch dynamically. Never assume it's `main`. Use the detection method from Step 1 and apply it to all git diff/log commands and PR creation.
11. **Professional Tone:** Maintain professional, technical language appropriate for a high-performance graphics project

# EXAMPLE WORKFLOW

## Step 1-4: Gather Information and Generate Description

After running git commands and analysis, generate the PR description:

```markdown
## Description

This PR implements a GPGPU-accelerated particle simulation system using FBO ping-pong techniques. It establishes the core simulation loop with Velocity Verlet integration and curl noise vector fields, ensuring 60 FPS performance with 1 million particles.

Key changes:

- Added `useGPGPU` hook for FBO lifecycle management
- Implemented simulation fragment shader with curl noise
- Created reactive bridge between Svelte stores and shader uniforms
- Added debug plane for visualizing velocity texture

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Performance improvement (optimization without changing functionality)
- [ ] Refactor (code restructuring without changing functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Test addition/update

## Architecture Impact

- **GPGPU:** New FBO ping-pong implementation for position/velocity textures
- **Reactive Bridge:** Store-to-uniform communication via `useGPGPU` hook
- **Shaders:** New simulation fragment shader with curl noise algorithm
- **Zero-Garbage:** All allocations pre-computed, no memory allocation in render loop

## Dependencies

No changes

## How should this be manually tested?

1. Start the development server and navigate to the application
2. Verify particles are rendering on screen
3. Check browser console for WebGL errors
4. Press 'D' to toggle debug view and verify velocity texture visualization
5. Monitor FPS counter (should maintain 60 FPS with default particle count)
6. Test with different particle counts in settings (verify performance scales)

## Performance Considerations

- Target: 60 FPS with 1,000,000 particles on GTX 1060 equivalent
- Uses WebGL2 FloatType textures for precision
- Zero-garbage render loop (pre-allocated variables)
- FBO ping-pong minimizes texture readback overhead

## Screenshots / Visual Changes

<!-- Add screenshots of particle system and debug view -->

## Highlights to Review

- FBO ping-pong implementation in `useGPGPU` hook
- Curl noise algorithm in simulation fragment shader
- Reactive bridge pattern (stores → uniforms)
- Verify zero-garbage compliance in render loop

## Checklist

- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes
- [x] I have verified zero-garbage principles (no allocations in render loops)
- [x] I have verified GPGPU/Web Worker separation of concerns
- [x] Performance targets are met (60 FPS, <50ms latency)

## Deployment Notes

No special deployment considerations
```

## Step 5: Generate PR Title

From branch `${CURRENT_BRANCH}` (e.g., `simulation-canvas`):

- Generate title: `feat: Simulation Canvas` (if commit messages indicate "feat")

## Step 6: Check for Existing PR

Execute:

```bash
CURRENT_BRANCH=$(git branch --show-current)
gh pr list --head ${CURRENT_BRANCH} --json number,title,url,state
```

Result: No existing PR found, proceeding to create.

## Step 7: Create PR

First, detect the base branch:

```bash
# Detect base branch using recommended method
CURRENT_BRANCH=$(git branch --show-current)
FIRST_COMMIT=$(git log --oneline --reverse ${CURRENT_BRANCH} --not main | head -1 | cut -d' ' -f1)

if [ -n "$FIRST_COMMIT" ]; then
  PARENT_COMMIT=$(git rev-parse "${FIRST_COMMIT}^" 2>/dev/null || echo "")
  if [ -n "$PARENT_COMMIT" ]; then
    BASE_BRANCH=$(git branch --contains $PARENT_COMMIT --all 2>/dev/null | \
      grep -v "$CURRENT_BRANCH" | \
      grep -v "HEAD" | \
      grep -v "remotes/origin/HEAD" | \
      grep -E "(main|master|develop|feature|fix)" | \
      head -1 | \
      sed 's/^[ *]*//' | \
      sed 's/^remotes\/origin\///')
  fi
fi

BASE_BRANCH=${BASE_BRANCH:-main}
echo "Detected base branch: $BASE_BRANCH"
```

Then create the PR using the detected base branch:

```bash
CURRENT_BRANCH=$(git branch --show-current)
COMMIT_TYPES=$(git log origin/${BASE_BRANCH}..HEAD --oneline 2>/dev/null | \
  grep -oE '^(feat|fix|perf|refactor|chore|docs|test|breaking)' | \
  head -1)

DESCRIPTION=$(echo ${CURRENT_BRANCH} | \
  sed 's/^feature\///' | \
  sed 's/^fix\///' | \
  sed 's/^perf\///' | \
  sed 's/^refactor\///' | \
  sed 's/-/ /g' | \
  sed 's/\b\(.\)/\u\1/g')

if [ -n "$COMMIT_TYPES" ]; then
  PR_TITLE="${COMMIT_TYPES}: ${DESCRIPTION}"
else
  PR_TITLE="${DESCRIPTION}"
fi

gh pr create --base ${BASE_BRANCH} --title "${PR_TITLE}" --body "<PR description>"
```

## Step 8: Output Result

**✅ Pull Request Created Successfully!**

**PR Details:**

- **Number:** #<PR_NUMBER>
- **Title:** ${PR_TITLE} (e.g., `feat: Simulation Canvas`)
- **Status:** OPEN
- **URL:** https://github.com/ethx42/kinetic-visual-synthesizer/pull/<PR_NUMBER>
- **Base branch:** ${BASE_BRANCH} (detected automatically, e.g., `main`)
- **Head branch:** ${CURRENT_BRANCH} (e.g., `simulation-canvas`)

The PR is ready for review!
