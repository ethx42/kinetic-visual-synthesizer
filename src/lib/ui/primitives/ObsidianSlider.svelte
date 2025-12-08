<script lang="ts">
	import { Slider } from 'bits-ui';
	import { cn } from '$lib/utils';

	export let value: number[] = [0];
	export let min = 0;
	export let max = 100;
	export let step = 1;
	export let label = '';
	export let className: string | undefined = undefined;
</script>

<div class={cn('w-full space-y-3', className)}>
	{#if label}
		<div class="flex items-center justify-between">
			<label
				class="text-xs font-medium uppercase tracking-widest text-obsidian-text-secondary"
				for="slider-{label}"
			>
				{label}
			</label>
			<span class="font-mono text-xs tabular-nums text-signal-cyan">
				{value[0]}
			</span>
		</div>
	{/if}

	<Slider.Root
		bind:value
		type="multiple"
		{min}
		{max}
		{step}
		id="slider-{label}"
		class="relative flex w-full touch-none select-none items-center"
	>
		<!-- Custom Track -->
		<span class="relative h-[2px] w-full grow rounded-full bg-white/10">
			<Slider.Range
				class="absolute h-full rounded-full bg-gradient-to-r from-signal-cyan/50 to-signal-cyan"
			/>
		</span>
		<Slider.Thumb
			index={0}
			class="block size-4 rounded-full border border-signal-cyan bg-white shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
		/>
	</Slider.Root>
</div>
