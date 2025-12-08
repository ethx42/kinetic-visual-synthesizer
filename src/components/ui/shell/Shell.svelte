<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { isPanelOpen, togglePanel, portalMode } from '$lib/stores/ui';
	import { ChevronDown } from 'lucide-svelte';

	// State derived from store
	$: isOpen = $isPanelOpen;
	$: isPortal = $portalMode;
</script>

<!-- The Portal Overlay (Glow) -->
<div
	class="pointer-events-none fixed inset-0 z-50 transition-all duration-300 border-[0px] border-signal-cyan/40"
	class:opacity-0={!isPortal}
	class:opacity-100={isPortal}
	class:border-[2px]={isPortal}
	class:shadow-[inset_0_0_100px_30px_rgba(120,50,255,0.3)]={isPortal}
></div>

<!-- The Trigger (Visible when closed) -->
{#if !isOpen}
	<button
		in:fade={{ duration: 300 }}
		out:fade={{ duration: 200 }}
		on:click={togglePanel}
		class="fixed z-40 group transition-all duration-300 outline-none
           /* Mobile: Shard */
           bottom-[33%] right-0 w-1.5 h-12 bg-white/20 rounded-l-sm
           hover:bg-signal-cyan hover:w-3 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]
           active:scale-95
           /* Desktop: Tab */
           md:bottom-0 md:right-auto md:left-1/2 md:-translate-x-1/2 md:w-32 md:h-6 md:rounded-t-lg md:rounded-bl-none md:bg-obsidian-base/50 md:backdrop-blur-md md:border-t md:border-x md:border-white/10"
		aria-label="Open Controls"
	>
		<!-- Desktop Grip Icon -->
		<div
			class="hidden md:flex justify-center items-center h-full opacity-50 group-hover:opacity-100 text-white"
		>
			<div
				class="w-8 h-1 rounded-full bg-white/20 group-hover:bg-signal-cyan/50 transition-colors"
			></div>
		</div>
	</button>
{/if}

<!-- The Panel -->
{#if isOpen}
	<aside
		transition:fly={{ y: 200, duration: 500, easing: cubicOut }}
		class="glass-obsidian fixed z-40 flex flex-col transition-all duration-300
           /* Mobile: Full Screen */
           inset-0
           /* Desktop: Bottom Dock */
           md:inset-x-0 md:bottom-0 md:top-auto md:h-[35vh] md:border-t md:border-white/10"
		style="position: fixed; z-index: 40; transition-property: transform, opacity, background-color, border-color, box-shadow;"
		class:opacity-0={isPortal}
		class:pointer-events-none={isPortal}
	>
		<!-- Handle / Header -->
		<div
			class="h-12 flex items-center justify-between px-6 border-b border-white/5 relative shrink-0"
		>
			<!-- Drag Handle (Mobile only visually, but functional for closing) -->
			<button
				on:click={togglePanel}
				class="md:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full h-8 flex justify-center pt-3 cursor-grab active:cursor-grabbing"
				aria-label="Close Panel"
			>
				<div class="w-10 h-1 rounded-full bg-white/20"></div>
			</button>

			<h2 class="text-white/80 text-sm font-medium tracking-widest uppercase font-mono">
				KVS <span class="text-white/30 text-xs ml-1">v2.0</span>
			</h2>

			<!-- Close Button (Desktop mainly) -->
			<button
				on:click={togglePanel}
				class="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-md"
			>
				<ChevronDown size={16} />
			</button>
		</div>

		<!-- Content Area -->
		<!-- Mobile Portrait: Vertical scroll -->
		<!-- Desktop & Mobile Landscape: Horizontal scroll -->
		<div
			class="flex-1 p-0 relative overflow-y-auto overflow-x-hidden
			md:overflow-x-auto md:overflow-y-hidden"
		>
			<slot />
		</div>

		<!-- Portal Trigger (The Eye) -->
		<!-- We move this OUTSIDE the main aside to prevent pointer-events-none from killing the touch interaction -->
	</aside>

	<div
		class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-opacity duration-300"
		class:opacity-50={isPortal}
		class:hover:opacity-100={isPortal}
	>
		<button
			class="w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center group transition-all duration-300 hover:border-signal-cyan/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
			on:mousedown={() => portalMode.set(true)}
			on:mouseup={() => portalMode.set(false)}
			on:mouseleave={() => portalMode.set(false)}
			on:touchstart|preventDefault={() => portalMode.set(true)}
			on:touchend|preventDefault={() => portalMode.set(false)}
			on:touchcancel|preventDefault={() => portalMode.set(false)}
			aria-label="Hold for Portal Mode"
		>
			<div
				class="w-2 h-2 rounded-full bg-white/30 group-hover:bg-signal-cyan transition-colors"
			></div>
		</button>
	</div>
{/if}
