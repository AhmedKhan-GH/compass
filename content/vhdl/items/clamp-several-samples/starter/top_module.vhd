library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        sample_a, sample_b, sample_c : in signed(7 downto 0);
        clamped_a, clamped_b, clamped_c : out signed(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    clamped_a <= (others => '0');
    clamped_b <= (others => '0');
    clamped_c <= (others => '0'); -- TODO: reuse one signed clamp calculation
end architecture;
