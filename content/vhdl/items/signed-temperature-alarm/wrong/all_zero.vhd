library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        temperature : in std_logic_vector(7 downto 0);
        minimum : in std_logic_vector(7 downto 0);
        maximum : in std_logic_vector(7 downto 0);
        alarm : out std_logic;
        acceptable : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    alarm <= '0';
    acceptable <= '0';
end architecture;
