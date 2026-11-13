library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    clk : in std_logic;
    reset : in std_logic;
    sample : in std_logic_vector(7 downto 0);
    delayed : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of top_module is
    begin
    -- TODO: implement the required behavior.
    delayed <= (others => '0');
end architecture;
