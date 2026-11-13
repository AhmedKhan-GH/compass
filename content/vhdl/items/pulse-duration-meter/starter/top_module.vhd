library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, active : in std_logic;
        duration : out std_logic_vector(3 downto 0);
        done : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    duration <= (others => '0');
    done <= '0'; -- TODO: measure and report a completed pulse
end architecture;
