library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    sample : in std_logic_vector(7 downto 0);
    lower : in std_logic_vector(7 downto 0);
    upper : in std_logic_vector(7 downto 0);
    in_range : out std_logic;
    alarm : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- TODO: implement the required behavior.
    in_range <= '0';
    alarm <= '0';
end architecture;
