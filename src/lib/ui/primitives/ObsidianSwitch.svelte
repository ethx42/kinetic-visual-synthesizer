<script lang="ts">
	import { Switch } from 'bits-ui';
	import { cn } from '$lib/utils';

	export let checked = false;
	export let label = '';
	export let className: string | undefined = undefined;
</script>

<div class={cn('flex items-center justify-between', className)}>
	{#if label}
		<label
			class="cursor-pointer select-none text-xs font-medium text-obsidian-text-primary"
			for="switch-{label}"
		>
			{label}
		</label>
	{/if}
	<Switch.Root
		bind:checked
		id="switch-{label}"
		class={cn(
			'peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50',
			checked
				? 'border-signal-bio/50 bg-signal-bio/20 shadow-[0_0_15px_rgba(105,219,124,0.3)]'
				: 'border-white/10 bg-white/5'
		)}
	>
		<Switch.Thumb
			class={cn(
				'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
			)}
		/>
	</Switch.Root>
</div>
