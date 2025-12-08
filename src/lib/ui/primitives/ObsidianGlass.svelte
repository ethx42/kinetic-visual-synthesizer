<script lang="ts">
	import { cn } from '$lib/utils';
	export let className: string | undefined = undefined;
</script>

<div class={cn('glass-obsidian', className)}>
	<slot />
</div>
