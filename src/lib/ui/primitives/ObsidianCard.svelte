<script lang="ts">
	import { cn } from '$lib/utils';
	import ObsidianGlass from './ObsidianGlass.svelte';
	export let className: string | undefined = undefined;
	export let title: string | undefined = undefined;
</script>

<ObsidianGlass className={cn('rounded-xl border border-white/10 p-4', className)}>
	{#if title}
		<h3 class="mb-3 text-xs font-medium uppercase tracking-widest text-obsidian-text-secondary">
			{title}
		</h3>
	{/if}
	<slot />
</ObsidianGlass>
